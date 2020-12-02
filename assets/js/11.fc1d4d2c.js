(window.webpackJsonp=window.webpackJsonp||[]).push([[11],{366:function(t,a,e){"use strict";e.r(a);var s=e(42),r=Object(s.a)({},(function(){var t=this,a=t.$createElement,e=t._self._c||a;return e("ContentSlotsDistributor",{attrs:{"slot-key":t.$parent.slotKey}},[e("h1",{attrs:{id:"_3-引导扇区编程-16位实模式"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_3-引导扇区编程-16位实模式"}},[t._v("#")]),t._v(" 3. 引导扇区编程（16位实模式）")]),t._v(" "),e("p",[t._v("即使提供了事例代码，相信你也会发现在二进制编辑器上使用机器码令人沮丧，你必须记录这些机器码否则需要不断的查阅文档来找到让CPU完成特定的功能机器码。幸运的是你并不孤单，因此汇编程序出现了，它可以将更人性化的指令翻译成特定CPU上的机器代码。")]),t._v(" "),e("p",[t._v("在本章中，我们将探索越来越复制的引导扇区，来让我们熟悉我们的程序运行的贫瘠的操作系统之前的环境和 汇编语言。")]),t._v(" "),e("h2",{attrs:{id:"_3-1-回顾引导扇区"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_3-1-回顾引导扇区"}},[t._v("#")]),t._v(" 3.1 回顾引导扇区")]),t._v(" "),e("p",[t._v("现在，我们要使用汇编语言来重写第二章中使用二进制编写的引导扇区，这样我们可以体验到使用高级语言的价值，即使是用很底层的汇编语言。")]),t._v(" "),e("p",[t._v("我们可以将这些代码汇编成机器代码（我们的CPU可以解释的字节序列， 称为指令）:")]),t._v(" "),e("div",{staticClass:"language- extra-class"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[t._v("$nasm_boot sect.asm -f bin -o boot_sect.bin\n")])])]),e("p",[e("code",[t._v("boot_sect.asm")]),t._v(" 中保存的是图表3.1的源代码，"),e("code",[t._v("boot_sect.bin")]),t._v(" 是汇编后的机器代码，我们可以用来作为磁盘上的引导扇区。")]),t._v(" "),e("p",[t._v("注意我们使用-f bin 选项来告诉nasm生成原始机器代码，而不是生成含有附加元信息的代码包，在通常操作系统环境下，这些元信息用来帮助连接其他的库。我们不需要这些元信息，现在除了底层的额BIOS。我们是这个计算机上唯一运行的软件，尽管这这个阶段处理无限的循环我们没有提供任何功能，但是很快我们将基于此来构建我们的完整系统。")]),t._v(" "),e("div",{staticClass:"language- extra-class"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[t._v(' loop:\njmp loop\ntimes 510-($-$$) db 0\n; Define a label, "loop", that will allow ; us to jump back to it, forever.\n; Use a simple CPU instruction that jumps\n; to a new memory address to continue execution.\n; In our case, jump to the address of the current ; instruction.\ndw 0xaa55\n\n; When compiled, our program must fit into 512 bytes,\n; with the last two bytes being the magic number,\n; so here, tell our assembly compiler to pad out our\n; program with enough zero bytes (db 0) to bring us to the ; 510th byte.\n; Last two bytes (one word) form the magic number, ; so BIOS knows we are a boot sector.\n')])])]),e("p",[t._v("图表 3.1: 一个使用汇编语言编写的简单的引导扇区")]),t._v(" "),e("p",[t._v("我们可以通过运行Bochs来方便地测试此程序，而不是将其保存到软盘的引导扇区并重新启动机器：")]),t._v(" "),e("div",{staticClass:"language- extra-class"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[t._v("\n$bochs\n")])])]),e("p",[t._v("或者，根据我们的偏好和模拟器的可用性，我们可以使用QEmu，如下所示：")]),t._v(" "),e("div",{staticClass:"language- extra-class"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[t._v("$qemu boot sect.bin\n")])])]),e("p",[t._v("或者，您可以将镜像文件加载到虚拟化软件中，或者将其写入某个可引导介质中，然后从真实的计算机引导它。请注意，当您将镜像文件写入某个可引导介质时，并不意味着您要将该文件添加到该介质的文件系统中：您必须使用适当的工具在底层意义上直接写入代码到介质（例如，直接写入磁盘的扇区）。")]),t._v(" "),e("p",[t._v("如果我们想跟容易的看到汇编器到底创建了什么字节，我们可以运行下面的命令，这个命令使用容易读的十六进制格式展示文件内二进制内容。")]),t._v(" "),e("div",{staticClass:"language- extra-class"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[t._v("od -t x1 -A n boot sect.bin\n")])])]),e("p",[t._v("这个命令的输出应该看起来很熟悉。")]),t._v(" "),e("p",[t._v("恭喜，你刚用汇编语言谢了一个引导扇区。正如我们将看到的，所有的操作系统都是这样启动的，然后将自己提升到更高级的抽象（例如高级语言，如果C/C++）")]),t._v(" "),e("h2",{attrs:{id:"_3-2-16位实模式"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_3-2-16位实模式"}},[t._v("#")]),t._v(" 3.2 16位实模式")]),t._v(" "),e("p",[t._v("CPU制造商必须不遗余力地保持他们的CPU（即他们的特定指令集）与早期的CPU兼容，这样旧的软件，特别是旧的操作系统，仍然可以在最现代的CPU上运行。")]),t._v(" "),e("p",[t._v("英特尔和兼容CPU实施的解决方案是模拟该家族中最古老的CPU：英特尔8086，它支持16位指令并且没有内存保护的概念，内存保护对于现代操作系统的稳定性至关重要，因为 它允许操作系统限制用户进程访问内核内存，无论用户进程有意或无意的访问内核内存，都可能导致用户进程避开安全机制或者直接导致整个系统瘫痪。")]),t._v(" "),e("p",[t._v("因此，为了向后兼容，CPU在启动初始化时以16位实模式启动是很重要的，这要求现代操作系统显式地切换到更高级的32位（或64位）保护模式，但允许旧的操作系统在没有意识到它们是在现代CPU上运行时继续运行，稍后我们将详细介绍从16位实模式到32位保护模式的重要步骤。")]),t._v(" "),e("p",[t._v("通常我们说一个CPU是16位的，意思是它一次最多能处理16位的指令。例如：一个16位的CPU将有一个特殊的指令，这个指令能够在一次CPU周期内将两个16位的数字相加，如果某个流程需要将32位的数据相加，那么这将花费更多的使用16位加法的周期。")]),t._v(" "),e("p",[t._v("首先我们将探索16位实模式的环境，应为所有的操作系统都是从这开始的，然后我们将看到怎么切换到32位保护模式及这样做的主要好处。")]),t._v(" "),e("h2",{attrs:{id:"_3-3-嗯-hello"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_3-3-嗯-hello"}},[t._v("#")]),t._v(" 3.3 嗯， Hello ?")]),t._v(" "),e("p",[t._v("现在我们将写一个看起来简单的引导程序-打印一条信息到显示器上。为了实现这个引导程序，我们需要学习一些基础知识，CPU是怎么工作的我们怎么使用BIOS来帮助我们操纵显示器设备。")]),t._v(" "),e("p",[t._v("首先，让我们想想我们要做什么。我们希望在显示器上打印一个字符但是我们不知道怎么与显示设备交流，因为可能有很多类型的显示设备并且它们可能有不同的接口。这就是为什么我们需要使用BIOS，因为BIOS已经自动检测了硬件，从BIOS能在启动时打印关于自检的信息到显示器就可以看出来，所以可以方便的提供这方面的服务给我们。")]),t._v(" "),e("p",[t._v("然后下一步，我们希望告诉BIOS 打印一个字符给我们。但是我们怎么告诉BIOS打印字符呢？这里没有Java库来调用输出到显示器上-这是梦想而已，当我们可以确认的是在计算机内存的某个地方有一些BIOS机器代码知道怎么打印输出到显示器。我们可能可以在内存中找到BIOS代码然后执行它，但是事实是这样做很麻烦而且不值得，并且当在不同的机器上不同的BIOS内部程序有差异是，这样做容易产生错误。")]),t._v(" "),e("p",[t._v("我们怎么使用计算机内部的基础机制：interrupts（中断）")]),t._v(" "),e("h3",{attrs:{id:"_3-3-1-中断-interrupts"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_3-3-1-中断-interrupts"}},[t._v("#")]),t._v(" 3.3.1 中断（Interrupts）")]),t._v(" "),e("p",[t._v("中断是一种机制，它能允许CPU暂定正在做的任务转而执行其他的高优先级任务，然后返回继续源任务。中断可以被软件指令（例如：0x10）或者一些需要高优先级操作（如：从网络上读取数据）的硬件触发。")]),t._v(" "),e("p",[t._v("每一个中断都由一个唯一的数字表示，这个数字是中断向量的索引，BIOS在内存开始处初始化一个表包含指向中断服务程序（ISRs）的指针。一个 ISR 就是一段处理特定中断（如：可能是从磁盘驱动或者网卡读取新的数据）的机器指令的序列，很想我们的引导扇区代码。")]),t._v(" "),e("p",[t._v("所以，BIOS向中断向量添加了自己针对计算机某些特定方面的ISRs。例如：0x10中断导致显示相关的ISR被调用，和0x13中断关于磁盘I/O 的ISR。\n然而，如果给每个BIOS程序分配一个中断是很浪费的，所以BIOS通过我们可以想到的一个大的switch语句来复用ISRs，通常基于CPU上的通用寄存器ax的值来触发具体的中断。")]),t._v(" "),e("h3",{attrs:{id:"_3-3-2-cpu-寄存器-registers"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_3-3-2-cpu-寄存器-registers"}},[t._v("#")]),t._v(" 3.3.2 CPU 寄存器（Registers）")]),t._v(" "),e("p",[t._v("在特定的程序中像高级语言使用变量一样将数据临时储存起来很有用。所有的x86CPU 有4个通用寄存器，ax bx，cx，和dx 来达到临时储存的目的。它们每个可以保存1个字（2个字节，16位）的数据，并且可以以较访问主存无延迟的速度读写。在汇编程序中，最常见的操作是在寄存器之间移动（确切的说事复制）数据：")]),t._v(" "),e("div",{staticClass:"language- extra-class"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[t._v("mov ax, 1234 mov cx, 0x234 mov dx, ’t’ mov bx, ax\n; store the decimal number 1234 in ax\n; store the hex number 0x234 in cx\n; store the ASCII code for letter ’t’ in dx\n; copy the value of ax into bx, so now bx == 1234\n")])])]),e("p",[t._v("mov 操作的目的是第一个参数而不是第二个，不过在不通的汇编语言中这种格式不一样。")]),t._v(" "),e("p",[t._v("有时仅操作一个字节很方便，所以寄存器允许单独的设置高位字节和低位字节：")]),t._v(" "),e("div",{staticClass:"language- extra-class"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[t._v("mov ax, 0 mov ah, 0x56 mov al, 0x23 mov ah, 0x16\n; ax -> 0x0000, or in binary 0000000000000000 ; ax -> 0x5600\n; ax -> 0x5623\n; ax -> 0x1623\n")])])]),e("p",[t._v("#3.3.3 汇总\n回到之前的需求，我们希望BIOS能为我们打印一个字符到显示器，我们可以通过设置ax寄存器的值为某些BIOS定义好的值来触发特定的中断来调用特定的BIOS程序，这个IBOS程序可以像显示器打印一个字符并将光标向前移动一位为下一次打印做准备。这里列出了完整的BIOS例程，向您显示了要使用的中断以及如何在中断之前设置寄存器。 在这里，我们需要中断0x10，并将ah设置为0x0e（以指示远程输入模式），将al设置为我们希望打印的字符的ASCII码。")]),t._v(" "),e("div",{staticClass:"language- extra-class"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[t._v(";\n; A simple boot sector that prints a message to the screen using a BIOS routine. ;\nmov ah, 0x0e ; int 10/ah = 0eh -> scrolling teletype BIOS routine\n   mov al, ’H’ int 0x10 mov al, ’e’ int 0x10 mov al, ’l’ int 0x10 mov al, ’l’ int 0x10 mov al, ’o’ int 0x10\njmp $\n; Jump to the current address (i.e. forever).\n;\n; Padding and magic BIOS number. ;\ntimes 510-($-$$) db 0 ; Pad the boot sector out with zeros\ndw 0xaa55 ; Last two bytes form the magic number,\n; so BIOS knows we are a boot sector.\n")])])]),e("p",[t._v("图表3.2 展示来整个引导扇区程序，注意再这个例子中我们只需要设置一次ah，然后修改al 为不通的字符就行来。")]),t._v(" "),e("div",{staticClass:"language- extra-class"},[e("pre",{pre:!0,attrs:{class:"language-text"}},[e("code",[t._v("b4 0e b0 48 cd 10 b0 65 cd 10 b0 6c cd 10 b0 6c cd 10 b0 6f cd 10 e9 fd ff 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00\n*\n00 00 00 00 00 00 00 00 00 00 00 00 00 00 55 aa\n")])])]),e("p",[t._v("图表3.3")]),t._v(" "),e("p",[t._v("为了完整性， 图表3.3 显示了这个引导扇区的原始机器代码。这是精确的告诉CPU做什么的实际字节。如果您对编写这样一个几乎毫无用处的程序所涉及的大量工作和理解感到惊讶，那么请记住，这些指令非常紧密地映射到CPU的电路，因此它们一定很简单 ，但速度也很快。 您现在已经真正了解了您的计算机。")]),t._v(" "),e("h2",{attrs:{id:"_3-4-hello-world"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_3-4-hello-world"}},[t._v("#")]),t._v(" 3.4 Hello World!")]),t._v(" "),e("p",[t._v("现在我们将尝试一个比hello程序稍微高级一点的版本。这个版本将引入跟多的CPU基础知识并了解引导扇区被BIOS占用的内存环境的。")]),t._v(" "),e("h3",{attrs:{id:"_3-4-1-内存-地址-和标签-memory-addresses-labels"}},[e("a",{staticClass:"header-anchor",attrs:{href:"#_3-4-1-内存-地址-和标签-memory-addresses-labels"}},[t._v("#")]),t._v(" 3.4.1 内存，地址，和标签 （Memory, Addresses, Labels）")]),t._v(" "),e("p",[t._v("我们之前说过CPU怎么从内存中取指执行的，以及BIOS怎么加载我们的512字节的引导扇区到内存中并初始化然后告诉CPU跳转到我们代码的开始处，从这里开始执行一条指令，然后下一条，下一条，等等。")]),t._v(" "),e("p",[t._v("所以我们的引导扇区是内存中的某个地方，但是在哪里呢？我们可以把主存想象成通过地址独立访问的字节长序列，所以如果想知道第54个字节的内容，54就是我们的它的地址，通常使用16进制的格式将地址表示为0x36更方便。")])])}),[],!1,null,null,null);a.default=r.exports}}]);