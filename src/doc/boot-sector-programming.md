# 3. 引导扇区编程（16位实模式）

即使提供了事例代码，相信你也会发现在二进制编辑器上使用机器码令人沮丧，你必须记录这些机器码,否则需要不断的查阅文档来找到让CPU完成特定的功能机器码。幸运的是你并不孤单，因此汇编程序出现了，它可以将更人性化的指令翻译成特定CPU上的机器代码。

在本章中，我们将探索越来越复杂的引导扇区编程，来熟悉我们的程序运行之上的汇编环境和引入操作系统之前的贫瘠环境。

## 3.1 回顾引导扇区
现在，我们要使用汇编语言来重写第二章中使用二进制编写的引导扇区，这样即使是用很底层的汇编语言，我们也可以体验到使用高级语言的价值。

我们可以将这些代码汇编成机器代码（我们的CPU可以解释的字节序列， 称为指令）:
```bash
$nasm boot_sect.asm -f bin -o boot_sect.bin
```

`boot_sect.asm` 中保存的是图表3.1的源代码，`boot_sect.bin ` 是汇编后的机器代码，我们可以用来作为磁盘上的引导扇区。

注意我们使用-f bin 选项来告诉nasm生成原始机器代码，而不是生成含有附加元信息的代码包，在通常操作系统环境下，这些元信息用来帮助连接其他的库。我们不需要这些元信息，现在除了底层的BIOS服务程序。这是这个计算机上运行的唯一软件，尽管这这个阶段除了无限的循环我们没有提供任何功能，但是很快我们将基于此来构建我们的完整系统。

``` nasm

; Define a label, "loop", that will allow 
; us to jump back to it, forever.
; Use a simple CPU instruction that jumps
; to a new memory address to continue execution.
; In our case, jump to the address of the current 
; instruction.
loop:
jmp loop

; When compiled, our program must fit into 512 bytes,
; with the last two bytes being the magic number,
; so here, tell our assembly compiler to pad out our
; program with enough zero bytes (db 0) to bring us to the 
; 510th byte.
times 510-($-$$) db 0

; Last two bytes (one word) form the magic number, 
; so BIOS knows we are a boot sector.
dw 0xaa55
```
>图表 3.1: 一个使用汇编语言编写的简单的引导扇区

比起将其保存到软盘的引导扇区并重新启动机器,我们可以通过运行Bochs来方便地测试此程序：
```bash
$bochs
```

或者，根据我们的偏好和模拟器的可用性，我们可以使用QEmu，如下所示：

```bash
$qemu boot_sect.bin
```

或者，您可以将这个镜像文件加载到虚拟化软件中，或者将其写入某个可引导介质中，然后从真实的计算机引导它。请注意，当您将镜像文件写入某个可引导介质时，并不意味着您要将该文件添加到该介质的文件系统中：您必须使用适当的工具在底层意义上直接写入代码到介质（例如，直接写入磁盘的扇区）。

如果我们想更容易的看到汇编器到底创建了什么字节，我们可以运行下面的命令，这个命令使用容易读的十六进制格式展示文件内二进制内容。

```bash
od -t x1 -A n boot sect.bin
```

这个命令的输出应该看起来很熟悉。

恭喜，你刚用汇编语言编写了一个引导扇区。正如我们将看到的，所有的操作系统都是这样启动的，然后将自己提升到更高级的抽象（例如高级语言，如C/C++）

## 3.2 16位实模式

CPU制造商必须不遗余力地保持他们的CPU（即他们的特定指令集）与早期的CPU兼容，这样旧的软件，特别是旧的操作系统，仍然可以在现代的CPU上运行。

英特尔为了兼容CPU采用的解决方案是模拟该家族中最古老的CPU：英特尔8086，它支持16位指令并且没有内存保护的概念，内存保护对于现代操作系统的稳定性至关重要，因 它允许操作系统限制用户进程访问内核内存，无论用户进程有意或无意的访问内核内存，都可能导致用户进程避开安全机制或者直接导致整个系统瘫痪。

因此，为了向后兼容，CPU在启动初始化时以16位实模式启动是很重要的，这要求现代操作系统显式地切换到更高级的32位（或64位）保护模式，但允许旧的操作系统无意识的继续运行在现代操作系统上，稍后我们将详细介绍从16位实模式到32位保护模式的重要步骤。

通常我们说一个CPU是16位的，意思是它一次最多能处理16位的指令。例如：一个16位的CPU将有一个特殊的指令，这个指令能够在一次CPU周期内将两个16位的数字相加，如果某个流程需要将32位的数据相加，那么这将花费更多的使用16位加法的周期。

首先我们将探索16位实模式的环境，因为所有的操作系统都是从这开始的，然后我们将学习怎么切换到32位保护模式及这样做的主要好处。

## 3.3 嗯， Hello ?
现在我们将写一个看起来简单的引导程序-打印一条短的信息到显示器上。为了实现这个引导程序，我们需要学习一些基础知识，CPU是怎么工作的我们怎么使用BIOS来帮助我们操纵显示器设备。

首先，让我们想想我们要做什么。我们希望在显示器上打印一个字符但是我们不知道怎么与显示设备交流，因为可能有很多类型的显示设备并且它们可能有不同的接口。这就是为什么我们需要使用BIOS，因为BIOS已经自动检测了硬件，从BIOS能在启动时打印关于自检的信息到显示器就可以看出来，所以可以方便的提供这方面的服务给我们。

然后下一步，我们希望告诉BIOS 打印一个字符给我们。但是我们怎么告诉BIOS打印字符呢？这里没有Java库来调用输出到显示器上-这是梦想而已，但我们可以确认的是在计算机内存的某个地方有一些BIOS机器代码知道怎么打印输出到显示器。我们可能可以在内存中找到BIOS代码然后执行它，但是事实是，这样做很麻烦而且不值得，并且当在不同的机器上不同的BIOS内部程序有差异时，这样做容易产生错误。

这里我们可以使用计算机内部的基础机制：interrupts（中断）

### 3.3.1 中断（Interrupts）
中断是一种机制，它能允许CPU暂定正在做的任务转而执行其他的高优先级任务，然后返回继续源任务。中断可以被软件指令（例如：0x10）或者一些需要高优先级操作（如：从网络上读取数据）的硬件触发。

每一个中断都由一个唯一的数字表示，这个数字是中断向量的索引，BIOS在内存开始处（在物理地址0x0处）初始化一个向量表，表内包含指向中断服务程序（ISRs）的指针。一个 ISR 就是一段处理特定中断（如：可能是从磁盘驱动或者网卡读取新的数据）的机器指令的序列，很像我们的引导扇区代码。

所以，BIOS向中断向量添加了自己针对计算机某些特定方面的ISRs。例如：0x10中断导致显示相关的ISR被调用，，0x13中断是关于磁盘I/O 的ISR。
然而，如果给每个BIOS程序分配一个中断是很浪费的，所以BIOS通过我们可以想到的一个大的switch语句来复用ISRs，通常基于CPU上的通用寄存器ax的值来触发具体的中断。

### 3.3.2 CPU 寄存器（Registers）
就像在高级语言中使用变量一样，在特定的程序中将数据临时储存起来很有用。所有的x86CPU都有4个通用寄存器，ax bx，cx，和dx 用来达到临时储存的目的。每个通用寄存器可以保存1个字（2个字节，16位）的数据，并且可以以相对于访问主存来说无延迟的速度读写。在汇编程序中，一个最常见的操作就是在寄存器之间移动（确切的说是复制）数据：

```nasm
mov ax, 1234   ; store the decimal number 1234 in ax
mov cx, 0x234  ; store the hex number 0x234 in cx
mov dx, ’t’    ; store the ASCII code for letter ’t’ in dx
mov bx, ax     ; copy the value of ax into bx, so now bx == 1234
```

注意 mov 操作的目的是第一个参数而不是第二个，不过在不同的汇编语言中这种对于目的参数的位置的约定不同。

有时仅操作一个字节很方便，所以寄存器允许单独的设置高位字节和低位字节：

```nasm
mov ax, 0      ; ax -> 0x0000, or in binary 0000000000000000
mov ah, 0x56   ; ax -> 0x5600
mov al, 0x23   ; ax -> 0x5623
mov ah, 0x16   ; ax -> 0x1623
```

### 3.3.3 汇总

回到之前的需求，我们希望BIOS能为我们打印一个字符到显示器，我们可以通过设置ax寄存器的值为某些BIOS定义好的值,然后触发特定的中断来调用特定的BIOS程序，我们需要的这个特定的服务程序就是BIOS滚动打印服务程序，这个BIOS程序可以向显示器打印单个字符并将光标向前移动一位，为下一次打印做准备。这里列出了完整的BIOS程序，向您显示了要使用的中断以及如何在中断之前设置寄存器。 在这里，我们需要中断0x10，并将ah设置为0x0e（以指示打印模式），然后将al设置为我们希望打印的字符的ASCII码。


```nasm
;
; A simple boot sector that prints a message to the screen using a BIOS routine. 
;


mov ah, 0x0e         ; int 10/ah = 0eh -> scrolling teletype BIOS routine
mov al, ’H’ 
int 0x10 
mov al, ’e’ 
int 0x10 
mov al, ’l’ 
int 0x10 
mov al, ’l’ 
int 0x10 
mov al, ’o’ 
int 0x10

jmp $                 ; Jump to the current address (i.e. forever).

;
; Padding and magic BIOS number. 
;
times 510-($-$$) db 0 ; Pad the boot sector out with zeros

dw 0xaa55             ; Last two bytes form the magic number,
                      ; so BIOS knows we are a boot sector.
```
>图表3.2 展示来整个引导扇区程序，注意再这个例子中我们只需要设置一次ah，然后修改al 为不通的字符就行来。

```
b4 0e b0 48 cd 10 b0 65 cd 10 b0 6c cd 10 b0 6c cd 10 b0 6f cd 10 e9 fd ff 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
*
00 00 00 00 00 00 00 00 00 00 00 00 00 00 55 aa
```
>图表3.3

为了完整性， 图表3.3 显示了这个引导扇区的原始机器代码。这是精确的告诉CPU做什么的实际字节。如果您对编写这样一个几乎毫无用处的程序所涉及的大量工作和理解感到惊讶，那么请记住，这些指令非常紧密地映射到CPU的电路，因此它们一定很简单 ，但速度也很快。 您现在已经真正了解了您的计算机。

## 3.4 Hello World!
现在我们将尝试一个比hello程序稍微高级一点的版本。这个版本将引入更多的CPU基础知识并了解我们的引导扇区被BIOS装载到的内存环境。

### 3.4.1 内存，地址，和标签 （Memory, Addresses, Labels）
我们之前介绍过CPU怎么从内存中取指执行，以及BIOS怎么加载我们的512字节的引导扇区到内存中并完成初始化，然后告诉CPU跳转到我们代码的开始处，并从这里开始执行一条指令，然后下一条，下一条，等等。

所以我们的引导扇区存在于内存中的某个地方，但是在哪里呢？我们可以把主存想象成能通过地址独立访问的长字节序列，所以如果想知道第54个字节的内容，54就是我们的它的地址，通常使用16进制的格式将地址表示为0x36更方便。

所以引导扇区最开始处即第一个机器代码字节在内存的某个地方，并且是BIOS将它们置于这个地方的。直到我们了解事实之前，我们可以先假设BIOS将我们的代码加载到内存的最开始处，即在地址0x0处。不过，这显然没有这么简单，因为我们知道在BIOS在加载我们的代码之前BIOS自己已经完成了初始化工作，并持续提供例如时钟中断和磁盘驱动等服务,所以BIOS服务（例如 ISRs， 打印输出到显示器服务，等等）自己本身也要存放到内存的某处，并且在使用这些服务期间，维持在内存中（不被别的代码覆盖）。还有，我们之前已经知道了，中断向量表存放在内存的开始处，如果BIOS 将我们的代码加载到这里，我们的代码将覆盖中断向量表，，因为中断序号于 ISR 之间的映射关系已经规定好了，当下一个中断出现时，计算机将会执行错误的中断服务，并导致崩溃并重启。

经过证明，BIOS 通常将引导扇区加载到0x7c00地址处，使用这个起始地址将保证代码不会覆盖其他重要的服务。图表3.4展示了当引导扇区刚被加载时计算机内典型的内存分布。所以，我们可能会命令CPU向内存中的任何地址写数据，这会导致发生严重的问题。因为内存中已经存放了一些其他的重要的服务例如时间中断和磁盘驱动。

<img :src="$withBase('/images/f3_4.png')" alt="典型的启动后内存分布">

>图表3.4: 典型的启动后内存分布
### 3.4.2 'X' 标记位置
现在我们将玩一个"找字节"的游戏，这个游戏将介绍内存引用，汇编语言中标签的使用，以及知道BIOS将我们的代码加载到哪里的重要性。我们将编写一个汇编程序，实现保存一个字符的字节数据，然后将这个字符打印到显示器上。为了完成这个程序，我们需要计算出它的绝对内存地址，然后我们就可以它加载到al寄存器中最后让BIOS打印输出它，如下练习：
```nasm
;
; A simple boot sector program that demonstrates addressing. 
;

mov ah, 0x0e              ; int 10/ah = 0eh -> scrolling teletype BIOS routine

; First attempt 
mov al, the_secret 
int 0x10                   ; Does this print an X?

; Second attempt
mov al, [the_secret] 
int 0x10                    ; Does this print an X?

; Third attempt 
mov bx, the_secret 
add bx, 0x7c00
mov al, [bx]
int 0x10                    ; Does this print an X?

; Fourth attempt
mov al, [0x7c1e]
int 0x10                    ; Does this print an X?

jmp $                       ; Jump forever. 

the_secret:
db "X"

; Padding and magic BIOS number.
times 510-($-$$) db 0 
dw 0xaa55

```

首先，当我们在程序中声明一些数据时，我们在它前面加上一个标签(the_secret).我们可以将标签放置到程序的任何位置，使用它们的唯一目的是为我们提供从代码开始到特定指令或数据的方便的偏移量。

```
b4 0e b0 1e cd 10 a0 1e 00 cd 10 bb 1e 00 81 c3 00 7c 8a 07 cd 10 a0 1e 7c cd 10 e9 fd ff 58 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00
*
00 00 00 00 00 00 00 00 00 00 00 00 00 00 55 aa
```
>图表3.5:

如果我们直接看图表3.5中的汇编后的机器代码，我们可以找到我们的'X'字符, 它的16进制ASCII码为0x58，它相较于代码的起始位置的偏移量为30(0x1e), 直接位于我们开始在引导扇区填充0的位置之前;

如果我们运行这个程序，我们会看到只有后两次尝试打印成功。

第一次尝试失败的问题是它试图将直接偏移量加载到al作为字符来打印。但是实际上我们需要打印的是在这个偏移量位置的字符，而不是偏移量本身。如后面一条尝试的例子，通过在偏移量外面加上方括号，可以命令CPU做正确的事情-保存一个地址中的内容。

那为什么第二个尝试失败了呢？它的问题是CPU将偏移量当作以从内存开始处的偏移。而不是从我们的代码加载的地方开始的偏移。这将导致这个偏移量指向到中断向量表上。在第三个尝试中，我们使用CPU add指令给 the_secret 偏移量加上了0x7c00地址，我们相信BIOS将我们的代码加载到0x7c00地址处。我们可以把 add 指令看作高级语言表达式 `bx = bx + 0x7c00`。我们现在计算出了'X'在内存中正确的地址，接着可以使用指令 `mov al, [bx]`将这个地址的内容存放到al寄存器中，为BIOS打印函数做准备

在第四个尝试中，我们试着跟聪明一些，在引导扇区被BIOS装载入内存后提前计算‘X’ 的地址。我通过提前检查二进制代码找到了地址0x7c12(查看 图表3.5)，在图表中显示，‘X’相对于我们的启动扇区的开始位置偏移0x1e(30)个字节。最后一个尝试提醒了我们为什么标签如此有用。因为如果没有标签我们将从编译后的代码中计算偏移量。如果代码的变更改变了偏移量改变，我们还需要更新偏移量。

这里我们看到了BIOS确实将我们的引导扇区加载到了0x7c00地址处。并且我们也看到了汇编代码中的标签与寻址的关系。

在代码中频繁的计算这种标签与内存的偏移很不方便。所以很多汇编程序在汇编期间纠正标签引用，如果你在你的代码的开始处包含以下指令明确告诉汇编程序你期望的代码在内存中的地址:
```
[org 0x7c00]
```

#### 问题1
当这个 org 指令添加到了这个引导扇区程序上，你觉得程序将会有怎样的打印结果？ 为了获得好成绩，请解释为什么会这样。

### 3.4.3 定义字符串
假设您想在某个时候打印一条预定义的消息（例如“引导操作系统”）到屏幕上；你会在汇编程序中如何定义这个字符串？我们得提醒自己计算机对字符串一无所知，字符串只是存储在内存某处的数据单元系列（例如字节、单词等）。

在汇编中我们可以像下面这样定义字符串：
```
my_string:
db ’Booting OS’
```
我们已经见过了 db 指令，可以翻译为“declare byte(s) of data”,这个指令告诉汇编程序将后面的字节直接写入到二进制输出文件中（即不要将他们翻译为处理器指令）。因为我们使用引号包裹数据，这样汇编程序就知道将其中的每个字符转换成ASCII字节码。注意，我们通常使用标签（例如：my_string）来标记数据的开始，否则我们没有其他容易的方法用来在我们的代码中引用数据。

在这个例子中，我们忽略了一件事：知道一个字符串有多长和知道它在哪里一样重要。毕竟所有处理字符串的代码是由我们编写的，所以有一个一致的策略来了解字符串的长度是很重要的。有几种可能，但惯例是将字符串声明为以null结尾，这意味着我们总是将字符串的最后一个字节声明为0，如下所示：
```
my_string:
db ’Booting OS’,0
```

当需要遍历一个字符串时，可能是轮流打印它的每一个字符，我们可以容易的知道什么时候遍历结束了。

### 2.4.4 使用栈
当提及底层计算的话题，我们经常听到大家谈论栈就像它是一种特殊的东西。栈其实是这些的问题的简单解决方案而已：CPU提供临时存储我们的程序的局部变量的寄存器的数量是有限的，但是我们通常需要比寄存器更多的临时储存。这时，显然我们可以使用主存，但是当读取或者写入时指明具体的内存地址很不方便，特别是当我们无需关心数据到底存放到哪里，只要我们能够容易的获取数据就够了。并且，我们将在后面看到，栈对于传递参数以实现函数调用也很有用。

所以，CPU提供了 `push` 和 `pop` 2条指令，分别用于重栈顶储存值和取出值，这样就不需要关心他们到底存放到哪里。注意，然而我们不能push 或者 pop 单个字节到栈上：在16位模式下，栈只能在16位长度下工作。


栈是通过 `bp` 和 `sp` 这两个特殊的CPU 寄存器实现的，它们分别维护栈基（即栈底）和栈顶的地址。随着我们不断的将数据压栈，栈将越来也大。 所以为了当栈生长的很大时没有覆盖重要程序（例如BIOS代码或我们的代码）的危险，我们通常将栈基设置在离这些重要程序很远的地方。堆栈的一个令人困惑的地方是它实际上是从基指针向下增长的，所以当我们发出一个push时，值实际上存储在bp地址的下面，而不是上面，而sp则按值的大小递减。

下面 图表3.6中的引导扇区程序展示了栈的使用。

```nasm
;
; A simple boot sector program that demonstrates the stack. 
;

mov ah, 0x0e                ; int 10/ah = 0eh -> scrolling teletype BIOS routine
mov bp, 0x8000              ; Set the base of the stack a little above where BIOS 
mov sp, bp                  ; loads our boot sector - so it won’t overwrite us

push ’A’                    ; Push some characters on the stack for later 
push ’B’                    ; retreival. Note, these are pushed on as
push ’C’                    ; 16-bit values, so the most significant byte 
                            ; will be added by our assembler as 0x00.

pop bx                      ; Note, we can only pop 16-bits, so pop to bx
mov al, bl                  ; then copy bl (i.e. 8-bit char) to al
int 0x10                    ; print(al)

pop bx                      ; Pop the next value 
mov al, bl                  
int 0x10                    ; print(al) 

mov al, [0x7ffe]            ; To prove our stack grows downwards from bp,
                            ; fetch the char at 0x8000 - 0x2 (i.e. 16-bits) 
int 0x10                    ; print(al)

jmp $                       ; Jump forever.


; Padding and magic BIOS number.
times 510-($-$$) db 0 
dw 0xaa55

```
>图表3.6： 使用 `push` 与 `pop` 操作栈

#### 问题2
图表3.6中的代码将以什么顺序打印什么？ 字符‘C’的ASCII码存放在内存中的绝对地址是什么？为了验证你的想法，你会发现尝试修改代码将有帮助。但是需要确认为什么在这个地址。

> 译者给出的测试代码
```nasm
;
; A simple boot sector program that demonstrates the stack. 
;

mov ah, 0x0e                ; int 10/ah = 0eh -> scrolling teletype BIOS routine
mov bp, 0x8000              ; Set the base of the stack a little above where BIOS 
mov sp, bp                  ; loads our boot sector - so it won’t overwrite us

push ’A’                    ; Push some characters on the stack for later 
push ’B’                    ; retreival. Note, these are pushed on as
push ’C’                    ; 16-bit values, so the most significant byte 
                            ; will be added by our assembler as 0x00.

mov bx, 0x8000              ; 将bx 设置为 bp 的值

sub bx, 0x2                 ; 减去 16 位 即 A 的地址保存到bx
mov al, [bx]                ; 将bx存的地址的内容放到al中
int 0x10                    ; 打印

sub bx, 0x2                 ; 同上打印B
mov al, [bx]
int 0x10

sub bx, 0x2                 ; 同上打印C
mov al, [bx]
int 0x10
   

pop bx                      ; Note, we can only pop 16-bits, so pop to bx
mov al, bl                  ; then copy bl (i.e. 8-bit char) to al
int 0x10                    ; print(al)

pop bx                      ; Pop the next value 
mov al, bl                  
int 0x10                    ; print(al) 

mov al, [0x7ffe]            ; To prove our stack grows downwards from bp,
                            ; fetch the char at 0x8000 - 0x2 (i.e. 16-bits) 
int 0x10                    ; print(al)

jmp $                       ; Jump forever.


; Padding and magic BIOS number.
times 510-($-$$) db 0 
dw 0xaa55

```

### 3.4.5 控制结构
当我们使用一门编程语言时，如果不清楚怎么编写一些它的基础控制结构（例如 if..then..elseif..else, for, 和 while.）我们将会不适应这门语言。这些结构运行代码执行可选的分支，是组成有用的程序的基础。

在编译后，这些高级控制结构简化为简单的跳转（jump）语句。实际上，我们已经见过最简单的循环事例了：

```nasm
some_label:
jmp some_label ; jump to address of label
```

或者，另一种方式，具有相同效果：
```nasm
jmp $ ; jump to address of current instruction
```

这个指令给我们提供了无条件跳转（即它一直跳转）的能力；但是我们通常需要基于某些条件跳转（例如一直循环知道我们循环了10次，等）。

在汇编语言中通过先执行一个比较指令，然后执行一个特定的条件跳转指令来实现条件跳转。
```nasm
cmp ax, 4               ; compare the value in ax to 4  将ax 中的值与4 比较
je then_block           ; jump to then_block if they were equal  如果结果相等则跳转到 then_block
mov bx , 45             ; otherwise , execute this code    否则执行这条代码
jmp the_end             ; important: jump over the ’then’ block,  重要：跳过 then 代码块，
                        ; so we don’t also execute that code.      这样我们就不会也执行 then 代码块中的内容
then_block: 
mov bx , 23

the_end:

```
在类似C或者Java的语言里，上面的代码有这样的形式：
```C
if(ax == 4) { 
    bx = 23;
} else { 
    bx = 45;
}
```

我们可以从汇编事例中看到，在幕后发生了一些事情，它将cmp指令与其执行的je指令相关联起来。这是一个事例关于CPU的特殊标记寄存器捕获cmp 指令的结果，然后接下来的条件跳转指令能够通过它来决定是否跳转到特定的地址。

基于之前的 `cmp x， y` 指令, 有以下的跳转指令可供使用：
```nasm
je target ; jump if equal
jne target ; jump if not equal
jl target ; jump if less than
jle target ; jump if less than or equal
jg target ; jump if greater than
jge target ; jump if greater than or equal

```

#### 问题3
从更高级的语言层面来规划条件代码，然后用汇编指令替换它总是很有用的。使用 `cmp` 及 合适的跳转指令将下面的伪汇编代码转换为完整的汇编代码。使用不同的 `bx` 来测试，并用你自己的语言来充分注释你的代码。
```
mov bx , 30
if (bx <= 4) { 
    mov al, ’A’
} else if (bx < 40) { 
    mov al, ’B’
} else {
    mov al, ’C’
}

mov ah, 0x0e            ; int=10/ah=0x0e -> BIOS tele-type output
int 0x10                ; print the character in al
jmp $

;Padding and magic number. 
times 510-($-$$) db 0
dw 0xaa55
```

>译者给出的答案
```nasm
mov bx, 30

cmp bx, 4        ; 比较bx 与 4
jle mva          ; 如果 bx <= 4 跳转到 mva 地址处
cmp bx, 40       ; 否则 比较 bx 与 40 
jl mvb           ; 如果bx 小与 40 跳转到 mvb 地址处
jmp mvc          ; 否则 跳转到 mvc 地址处


mva:              
mov al, 'A'      ; 将 'A' 赋给 al
jmp end          ; 跳转到 end 地址处

mvb:
mov al, 'B'      ; 将 'A' 赋给 al  
jmp end          ; 跳转到 end 地址处

mvc:
mov al, 'C'      ; 将 'A' 赋给 al

end:

mov ah, 0x0e     ; 将0x0e赋给ah
int 0x10         ; 调用0x10号中断

jmp $

times 510-($-$$) db 0
dw 0xaa55

```

### 3.4.6 调用函数
在高级语言中，我们将较大的问题分解为函数，本质上函数就是我们程序中重复调用的通用程序（例如 打印消息，向文件写入，等），通常通过某种方式改变传递给函数的参数来改变输出的结果。在CPU层面，函数仅仅是向有用程序的地址的跳转然后在函数结束后跳回原来跳转指令紧接的下一条指令的地址。

我们可以这样模拟函数调用：
```nasm
...
...
mov al, ’H’                 ; Store ’H’ in al so our function will print it.

jmp my_print_function       
return_to_here:             ;This label is our life-line so we can get back.
...
...

my_print_function:          
mov ah, 0x0e                ;int=10/ah=0x0e -> BIOS tele-type output 
int 0x10                    ;print the character in al
jmp return_to_here          ;return from the function call.

```

首先，注意我们怎么将 `al` 寄存器作为参数, 这里通过提前设置它然后供函数使用。
这就是使高级语言实现参数传递成为可能的方式，调用方和被调用方必须就将要传递参数的位置和数量达成一致。

遗憾的是，这种方法的主要缺陷是我们需要明确指出在调用函数后返回到哪里，所以我们不可能从我们程序的任何地方调用这个函数，因为它始终返回到相同的地址，这里就是 return_to_here 标签的地址。

借用参数传递的主意，调用者代码可以保存正确的返回地址（即 调用后紧接的地址）到一些大家都知道的位置，然后被调用的代码可以跳转到事先保存的地址。CPU在特殊寄存器ip（指令指针）中跟踪当前正在执行的指令，但是遗憾的是我们不能直接访问ip寄存器，但是CPU给我们提供了一堆指令，`call` 和 `ret`, 通过这两个指令我们能实现我们所希望的跳转和返回：`call` 指令的行为与 `jmp` 指令一样，不过它回在实际跳转之前将返回的地址push 到 栈；`re`t 指令能从栈 `pop` 下返回的地址然后跳转过去，如下：
```nasm
...
...
mov al, ’H’                 ; Store ’H’ in al so our function will print it.

call my_print_function       
...
...

my_print_function:          
mov ah, 0x0e                ;int=10/ah=0x0e -> BIOS tele-type output 
int 0x10                    ;print the character in al
ret
```
我们的函数现在几乎是独立的了。