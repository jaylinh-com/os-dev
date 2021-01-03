# 4. 进入 32 位保护模式

如果继续在16位实模式下工作可能很美好，毕竟我们已经熟悉了这个环境，但是为了充分的利用 CPU 以及能更好的理解 CPU 体系结构的发展对现代操作系统的好处，即硬件中的内存保护。我们必须踏入 32 位保护模式。

32位保护模式主要有以下几点不同：
* 寄存器扩展到了 32 位，在寄存器前面加上 e 来访问全部的长度，例如：mov ebx, 0x274fe8fe
* 为了方便，增加来额外的 fs 和 gs 2个通用段寄存器 
* 提供 32位 的内存偏移能力，所以一个偏移量能引用惊人的4GB内存(0xffffffff)
* CPU 支持更完善的内存分段方式--尽管稍微变复杂来一点，这样的改变有2个大的好处：
- 一个段中的代码禁止执行比它特权级别高的段中的代码，这样能保护你们的内核代码免受用户应用的破坏和影响。
- CPU 能为用户进程提供虚拟内存，这样进程的内存中的页（固定大小的内存块）能在需要的时候在内存和磁盘之间透明的转换。这保证了主存使用更加高效，对于极少执行或使用的数据不需要占用宝贵的内存资源。

* 中断操作也更加完善。

关于 CPU 从 16位实模式切换到32位保护模式最难的部分是我们必须在内存中准备一个名为 全局描述表（global descriptor table GDT）的复杂数据结构，这个表用来定义内存段和它们的保护模式属性。一旦我们定义好了这个GDT， 我们就可以使用一个特殊的指令将它载入CPU，然后我们通过设置一个特殊的CPU控制寄存器中的一位来实际切换到保护模式。

如果不需要使用汇编语言来定义GDT这个过程将会很容易，但是如果后面我们希望加载一个由高级语言比如C编译的内核这种底层的切换就不可避免了。 高级语言通常会将代码编译为高效的32位指令而不是低效的16位指令。

哦，还有意见大事我差点忘了说：一旦我们进入了32位保护模式我们就不能继续使用BIOS服务了。如果你觉得调用BIOS服务是底层的。这像是退一步进两步。

## 4.1 适应没有 BIOS 的生活
为了充分的利用CPU， 我们必须放弃 BIOS 提供的所有的有用的程序。我们将在切换到 32 位保护模式后看到，BIOS 程序是编写在16位实模式下工作的，在32 位保护模式下将不再有效，实际上，尝试使用它们将是计算机崩溃。

所以这意味着我们的 32 位操作系统必须自己提供机器上所有的硬件的驱动（例如：键盘，显示器，磁盘驱动，和鼠标等）, 实际上，32 位保护模式的操作系统可以临时切换回 16 位实模式，然后使用BIOS程序，但是这样做非常的复杂，所以这样做是不值得的，特别是对于性能来说。

当切换到保护模式后我们将遇到的第一问题是知道怎么向显示器打印信息，以便我们知道计算机当前的状态。之前我们通过使用BIOS程序来向显示器上打印一个ASCII字符，但是这个程序是怎么在计算机显示器上合适的位置打印高亮适当的像素呢？当前，我们只需要知道显示设备能在2种模式下配置成多种分辨率中的一种就够了，这2种模式是 文本模式 和 图形模式，并且显示器上显示的东西是特定内存块的视觉展示。所以为了操作显示器，我们必须操作当前模式下的特定内存块。以这种方式工作的硬件称为内存映射硬件，显示设备是其中的一种。

无论计算机是否拥有更高级的图形硬件，大多数计算机启动时都是初始化为简单的 `VGA`（Video Graphics Array）文本模式以及 `80 * 25` 字符的尺寸。在文本模式下，编程者不需要通过渲染单个像素来描述特定的字符，因为VGA显示设备内部内存种以及预定义了简单的字体。实际上显示器上每一个字符单元由内存中的2个字节表示：第一个字节是将被显示的字符的ASCII码，第二个字节是这个字符的属性编码，例如它的前景色和后景色，以及字符是否闪烁。

所以如果我们希望在显示器上显示一个字符，在当前VGA模式下我们就需要在正确的内存地址处设置字符的ACII码和属性。这个地址通常在`0xb8000`处。如果我们简单的修改一下之前的(16位实模式)`print_string` 程序我们就可以不使用BIOS程序，而创建一个在32位保护模式下通过直接写入视频内存的方式的打印程序。如图表4.1所示。
```nasm
[bits 32]
; define some constants
VIDEO_MEMORY equ 0xb8000
WHITE_ON_BLACK equ 0x0f

; print a null-terminated string pointed to by EDX
print_string_pm:
  pusha
  mov edx, VIDEO_MEMORY         ; Set edx to the start of vid mem.
  
print_string_pm_loop:
  mov al, [ebx]                 ; Store the char at ebx in al
  mov ah, WHITE_ON_BLACK        ; Store the attributes in ah

  cmp al, 0                     ; if (al == 0), at end of string, so
  je done                       ; jump to done

  mov [edx], ax                 ; store char and attributes at current
  add ebx, 1                    ; increment ebx to the next char in string
  add edx, 2                    ; Move to next character cell in vid mem.

  jmp print_string_pm_loop      ; loop around to print the next char

print_string_pm_done:
  popa
  ret                           ; Return from the function
```
>图表4.1: 直接写入视频内存来打印字符串的程序（即不实用BIOS程序）

注意，尽管我们的显示器是以行和列来显示字符的，但是视频内存是简单连续的。例如：第3行第5列的地址应该这样计算 `0xb8000 + 2 * (row * 80 + col)`

我们的程序还有问题，即它每次都是从左上角开始打印字符串，所以它每次打印都是覆盖上一次的打印而不是接着上一次打印。我们可以花一点时间来改正这个汇编程序，但是这里我们先不管它让事情简单点，因为当我们切换到保护模式后，我们可以引导使用高级语言编写的代码，这时我们可以轻易的解决打印这样的问题。

## 4.2 理解全局描述符表(Global Descriptor Table)

在深入了解保护模式之前，我们需要先理解 GDT 的要点，因为它对保护模式下的操作很重要。回想在第3.6.1章中介绍的，在经典的16位实模式下设计段寻址的根本原因是为了允许编程者能够访问比16位偏移能允许的最大访问内存更大的内存空间（尽管在现在看来也不是很多）, 举一个例子，假设编程者想将ax的值保存到地址0x4fe56中，如果不使用段寻址，编程者最多只能访问到0xffff：

```nasm
mov [0xffff], ax
```

这样反问的地址比期望的小。但是如果使用段寻址我们可以这样来达到目的：

```nasm
mov bx, 0x4000
mov es, bx
mov [es:0xfe56], ax

```

尽管将内存分段然后使用段内偏移的基本想法是一样的，但是在保护模式下它们的实现却截然不同。主要是提供了更多的灵活性。一旦CPU切换到了32位保护模式，从逻辑地址（即段寄存器与一个偏移值的组合）转换到实际物理地址的过程完全不一样，不再是将段寄存器的值乘以16然后再将其加上偏移值，而是 段寄存器变为了GDT中的一个特定段描述符的索引。

段描述符是8字节的结构，它定义了保护模式下段的以下属性：
* 基地址(Base address)(占32位), 定义了段在物理内存中的起始。
* 段限制(Segment Limit)(占20位), 定义了段的大小。
* 各种标志(Various flags)，影响CPU对段的解释，比如运行其上的代码的特权级别或者段是否可读或可写。


图表4.2 显示了段描述符的实际结构，注意，这个结构将基地址和段限制分段保存在结构体内。例如 段限制的低16位保存在结构体的最开始2个字节处，而高4位保存在结构体中的第7个字节的开始处。也许这是开玩笑的做法，或者可能是有历史原因，也可能是受CPU 的硬件设计影响。这里我们带上这个疑惑继续学习。

<img :src="$withBase('/images/f4_2.png')" alt="段描述符结构" /> 

>图表4.2： 段描述符结构

我们不会详细的介绍段描述符的所有可能配置。完整详尽的解释可以参考Inter的开发者手册。但是为了让我们的代码运行在32位保护模式下我们将学习其中的必须部分。


Inter将可用的最简单的段寄存器配置描述为基本平面模型，这个模型中定义了2个重叠的段，2个段都覆盖了所有的4GB可寻址内存空间，一个用来存放代码一个用来存放数据,实际上模型中的2个段互相重叠所以这里不能保护段被另一个段所改写。这里也不能使用虚拟内存的页特性。在早期尽可能让事情简单点是值得的，特别是因为当我们一旦血换到了高级语言，我们可以更简单的修改段描述符。

除了代码和数据段，CPU需要将GDT的第一项设置为无效的null描述符（即8个0字节的结构体）。当我们在访问某个地址并忘记设置特定的段寄存器时，null描述符是一个简单的捕获错误的机制，当我们切到保护模式后如果我们设置了一个段寄存器为0x0但是忘记更新它们的时候很容易发送。但是使用null段描述符寻址时，CPU会触发异常，这里的异常本质上是一个中断，虽然不太相识，但是不能与高级语言如java 中的异常混淆。


我们的代码段有如下配置：
* Base: 0x0
* Limit: 0xfffff
* Present: 1, 因为段在内存中存在 - 用于虚拟内存
* Privilige: 0, 0是最高特权
* Descriptor type: 1 是代码或数据段, 0 用于陷阱
* Type:
     
    – Code: 1 是代码, 因为这是一个代码段

    – Conforming: 0, 不使用确认，意味着低特权级别的代码不能调用这个段中的代码 - 这是内存保护的关键

    – Readable: 1, 1 可读, 0 只能执行. 可读性允许我们读取代码中的常量.

    – Accessed: 0 通常御用调试或者虚拟内存技术，因为CPU在能访问短时可以设置位。


* Other flags

    – Granularity: 1, 如果设置这个，我们的段限制将乘以 4K，这样我们的最大可寻址地址由0xfffff 变为0xfffff000(即左移3个16进制数，允许段或者4Gb内存).

    – 32-bit default: 1, 默认 1 因为我们的段将存放32位代码，否则我们设置为0来存放使用16位代码，这实际上用来设置操作的默认数据单元大小（例如 声明0x4将扩展位32位的数字） 
    – 64-bit code segment: 0, 对于32位处理器没有作用

    – AVL: 0, 我们可以自己使用这个标记 (例如调试) 但是我们将不使用它


因为我们使用的是2个重叠的代码数据段简单平面模型，所以数据段基本与代码段一致除了一下标志的区别：
* Code: 0 表示数据
* Expand down: 0 . This allows the segment to expand down - TODO explain this
* Writable: 1. 表示这个数据段能被写入，否则表示数据段是只读的 
* Accessed: 0 通常御用调试或者虚拟内存技术，因为CPU在能访问短时可以设置位。

既然我们以及知道了这2个数据段的配置，明白了大多数段描述符的设置，保护模式在内存方面怎么较实模式提供更多的灵活性就显而易见了。


## 4.3 使用汇编语言定义GDT


既然我们知道了对于基本平面模型我们的GDT包含了什么段描述符，让我们来看看我们到底怎么使用汇编语言在GDT中表示，这是一项只需要耐心的任务。当你觉得乏味的时候，记住它的重大意义：我们在这里做的将很快允许我们引导我们将用高级语言编写的操作系统内核，然后我们的这一小步将会转变位一大步。

我们以及在汇编代码中见过一些使用db、dw、和dd定义数据的例子，这也是我们必须要使用的指令，用来在GDT中的段表述符项的合适字节存放数据。

实际上，为了CPU需要知道GDT有多长这个简单的原因。我们没有直接告诉GPU我们的GDT的实际地址而是各处一个简单GDT表述符来给出地址（即描述GDT的东西）。GDT是一个6字节的结构体包含：
* GDT 大小(16位)
* GDT 地址(32位)

注意，当在这样底层的语言下想这样操作复杂的数据结构，我们不能添加足够的注释。以下代码定义了我们的GDT 和 GDT 表述符；注意代码中我们怎么使用db、dw等，来填充结构提位我们的部分，以及怎么使用二进制字面量方便的设置标志，它们以b结尾：


```nasm
; GDT
gdt_start:

gdt_null:               ; the mandatory null descriptor
  dd 0x00               ; 'dd' means define double word(即4个字节)
  dd 0x00   

gdt_code:               ;   the code segment descriptor
  ; base = 0x0, limit=0xfffff,
  ; 1st flags: (present)1 (privilege)00 (descriptor type)1 -> 1001b
  ; type flags: (code)1 (conforming)0 (readable)1 (accessed)0 -> 1010b
  ; 2nd flags: (granularity)1 (32-bit default)1 (64-bit seg)0 (AVL)0 -> 1100b
  dw 0xfff              ; Limit (bits 0-15)
  dw 0x0                ; Base  (bits 0-15)
  db 0x00               ; Base  (bits 16-23)
  db 10011010b          ; 1st flags, type flags
  db 11001111b          ; 2nd flags, Limit(bits 16-19)
  db 0x0                ; Base (bits 24-31)

gdt_data:               ; the data segment descriptor
  ; Same as code segment except for the type flags:
  ; type flags: (code)0 (expand down)0 (writable)1 (accessed)0 -> 0010b
  dw 0xfff              ; Limit (bits 0-15)
  dw 0x0                ; Base  (bits 0-15)
  db 0x00               ; Base  (bits 16-23)
  db 10010010b          ; 1st flags, type flags
  db 11001111b          ; 2nd flags, Limit(bits 16-19)
  db 0x0                ; Base (bits 24-31)

gdt_end:                ; The reason for putting a label at the end of the GDT is so we can
                        ; have the assembler calculate the size of the GDT for the GDT descriptor (below)
                    
; GDT descriptor
gdt_descriptor:
  dw gdt_end -gdt_start -1    ; Size of our GDT, always less one of the true size
  dd gdt_start                ; Start address of our GDT

; Define some handy constants for the GDT segment descriptor offsets, which
; are what segment registers must contain when in protected mode. For example,
; when we set ds = 0x10 im pm, the CPU knows that we mean it to use the 
; segment described at offset 0x10 (即 16字节) in our GDT, which in our 
; case is the DATA segment (0x0 -> null; 0x08 -> CODE; 0x10->DATA)
CODE_SEG equ gdt_code - gdt_start
DATA_SEG equ gdt_data - gdt_start

```


## 4.4 开始切换

一但GDT和GDT描述符都在我们的引导扇区准备好了，我们就可以命令CPU从16位实模式切换到32位保护模式。

正如我之前所说的，实际的切换是相当直接的代码，但是理解涉及的步骤的重大意义是很重要的。

我们首先要做的是使用`cli`(clear interrupt)指令来禁用中断，这意味着CPU将简单的忽略以后可能发生的任何中断，至少直到中断被启用之前。这是很重要的，因为想段寻址和中断处理在保护模式下都是完全不同的实现。这让BIOS创建在内存起始处的中断服务毫无意义；并且即使CPU能够映射中断信号到对于的服务代码，这些代码也完全不能使用我们定义在GDT 中的32位段，所以最终会将段寄存器的值作为16位实模式下的段地址来处理导致CPU崩溃。



下一步是告诉CPU我们辛苦准备的 GDT 的信息。我们使用一个单指令来完成这项任务：

```nasm
lgdt [gdt_descriptor]
```

既然万事俱备，我们通过设置 `cr0` 这个特殊的CPU控制寄存器的首位来开始实际的切换。现在我们不能直接设置寄存器上的位，所以我们必须将它存入通用寄存器，然后设置这个位，接着将它存回到 `cr0`.类似与我们在第xxx节使用 `and` 指令来从值中排除位，我们可以使用 `or` 指令来包含特定的位到值中(即为了某些重要的原因，不干扰控制寄存器中其他的已设置好的位)
```nasm
mov eax, cr0    ; To make the switch to protected mode, we set 
or eax , 0x1    ; the first bit of CR0 , a control register
mov cr0, eax    ; Update the control register       
```

在 `cr0` 被更新后，CPU就切换到来32位保护模式了。

上面最后一段并不完全正确，因为现代处理器使用一种流水线技术，这种技术允许它们并发处理一个指令执行的不同阶段(我说的是单CPU，而不是并行CPU)因此使用更少的时间，例如，每个指令可能从内存中提取，解码成微指令，执行，然后将结果存回内存；由于这些阶段是半独立的，所以它们能在项目的CPU周期内使用不同的电路完成（例如，在解码一个指令的同时获取下一条指令）.

我们在对CPU进行编程时通常不需要操心CPU内部如流水线这样的事，但是切换CPU模式是一种特例，因为CPU可能会以错误的模式处理指令执行的某些阶段。所以我们需要做的是在命令CPU切换模式后，立即强制CPU完成流水线中的所有任务，这样我们就能确性以后所有的指令都能在正确的模式下执行。

现在，但CPU知道接下来将要出现的指令时，流水线工作的很好，因为可以预取这些指令，但是它不喜欢例如 `jmp` 或者 `call` 之类的执行，因为在这些指令完全执行前，CPU不知道后续的指令是哪些。特别是如果我们使用的是远程调整或者远程调用，远程的意思是跨段。所以在CPU切换模式后,我们可以立即发出远程跳转执行，这将强制CPU清空流水线(即将流水线中的不同阶段的指令全部完成)。

为了发出一个远程跳转，与近跳转（或标准跳转）相对，我们使用额外的提供目标段地址，如下：
```nasm
jmp <segment>:<address offset>
```

对于这个跳转，我们需要仔细考虑我们希望跳到哪里。假设我们在代码中创建一个标签例如 `start_protected_mode`，它标记了我们32位代码的开始。如我们前面所说，一个标准跳转，例如 `jmp start_protected_mode` 可能不会触发流水线的清空，此外，我们现在奇怪的境地，因为我们当前的代码段例(如cs)将在保护模式下无效，所以我们必须将我们的cs 寄存器更新为GDT中代码段描述符的偏移量。因为段描述符都是8字节长度，且我们的代码描述符是GDT中的第二个描述符（null描述符是第一个），它的偏移量就是0x8,所以这就是我们要设置到我们的代码段寄存器的值。注意，根据远程跳转的定义，它将自动导致CPU将cs寄存器更新为目标段，我们让汇编程序来计算这些段描述符的偏移量，并将它们储存在常量CODE_SEG 和 DATA_SEG 中，使用这2个标签将很方面，然后我们就得到来我们的跳转执行：

```nasm
jmp CODE_SEG:start_protected_mode

[bits 32]
start_protected_mode:
...                     ; By now we are assuredly in 32-bit protected mode. ...

```

注意，实际上我门根本不需要在跳转起始之间的物理距离上跳很远，重要的是我们怎么跳转。

同时注意我们需要使用 [bits 32] 指令告知汇编程序从这里开始，它需要解码32位模式指令。注意这并不是我们不能在16位实模式下使用32位指令，只是汇编程序在32位保护模式下必须对直接指令进行稍微不同的解码。实际上，当切换到保护模式我们使用32位寄存器 eax 来设置这个控制位。

现在我们处于32位保护模式了。一旦我们进入了32位模式，我们就可以开始将其他的段寄存器都更新位指向32位数据段（而不是现在无效的实模式段）并且更新栈的位置。

我们可以将所有的留存结合起来，编写如下伪代码：


```nasm
[bits 16]
; Switch to protected mode
switch_to_pm:
  cli                       ; We must switch off interrupts until we have 
                            ; set-up the protected mode interrupt vector 
                            ; otherwise interrupts will run riot
  lgdt [gdt_descriptor]     ; Load our global descriptor table, which defines
                            ; the protected mode segments (e.g. for code and data)
  
  mov eax, cr0              ; To make the switch to protected mode, we set
  or eax, 0x1               ; the first bit of CR0, a control register
  mov cr0, eax


  jmp CODE_SEG:init_pm      ; Make a far jump(i.e. to a new segment) to our 32-bit
                            ; code. This also forces the CPU to flush its cache of 
                            ; pre-fetched and real-mode decoded instructions, which can 
                            ; couse problems.    
  

[bits 32]
; Initialise registers and the stack once in PM.
init_pm:
  mov ax, DATA_SEG          ; Now in PM, our old segments are meaningless.
  mov ds, ax                ; so we point our segment registers to the 
  mov ss, ax                ; data selector we defined in our GDT
  mov es, ax
  mov fs, ax
  mov gs, ax

  mov ebp, 0x90000          ; Update our stack position so it is right
  mov esp, ebp              ; at the top of the free space.

  call BEGIN_PM             ; Finally, call some well-known label


        
``` 


## 4.5 综合使用
最后，我们可以将所有的程序引入引导扇区，用来展示从16位实模式切换到32位保护模式。


```nasm
; A boot sector that enters 32-bit protected mode.
[org 0x7c00]

mov bp, 0x9000              ; Set the stack.
mov sp, bp                  

mov bx, MSG_REAL_MODE

call print_string

call switch_to_pm           ; Note that we never return from here.

jmp $

%include "../print/print_string.asm"
%include "gdt.asm"
%include "print_string_pm.asm"
%include "switch_to_pm.asm"

[bits 32]
; This is where we arrive after switching to and initialising protected mode.
BEGIN_PM:
  mov ebx, MSG_PROT_MODE
  call print_string_pm      ; Use our 32-bit print routine.

  jmp $                     ; Hang.

; Global variables
MSG_REAL_MODE db "Started in 16-bit Real Mode", 0
MSG_PROT_MODE db "Successfully landed in 32-bit Protected Mode",0

; Bootsector padding
times 510 - ($-$$) db 0
dw 0xaa55

```