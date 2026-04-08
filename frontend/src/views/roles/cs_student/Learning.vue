<template>
  <div class="learning-page">
    <!-- 左侧：课程列表 -->
    <div class="courses-sidebar" :class="{ collapsed: coursesCollapsed }">
      <div class="sidebar-header">
        <h3 v-show="!coursesCollapsed">课程</h3>
        <button class="collapse-btn" @click="coursesCollapsed = !coursesCollapsed">
          {{ coursesCollapsed ? '→' : '←' }}
        </button>
      </div>
      <div class="course-list" v-show="!coursesCollapsed">
        <div
          v-for="course in courses"
          :key="course.id"
          class="course-item"
          :class="{ active: currentCourse?.id === course.id }"
          @click="selectCourse(course)"
        >
          <span class="course-icon">{{ course.icon }}</span>
          <div class="course-info" v-show="!coursesCollapsed">
            <span class="course-name">{{ course.name }}</span>
            <span class="course-progress">{{ getProgress(course) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 中间：章节列表 -->
    <div class="chapters-sidebar" v-if="currentCourse" :class="{ collapsed: chaptersCollapsed }">
      <div class="sidebar-header">
        <h3 v-show="!chaptersCollapsed">{{ currentCourse.name }}</h3>
        <button class="collapse-btn" @click="chaptersCollapsed = !chaptersCollapsed">
          {{ chaptersCollapsed ? '→' : '←' }}
        </button>
      </div>
      <div class="chapter-list" v-show="!chaptersCollapsed">
        <div
          v-for="chapter in currentCourse.chapters"
          :key="chapter.id"
          class="chapter-item"
          :class="{ active: currentChapter?.id === chapter.id, completed: chapter.completed }"
          @click="selectChapter(chapter)"
        >
          <span class="chapter-check" @click.stop="toggleComplete(chapter)">
            {{ chapter.completed ? '✓' : '○' }}
          </span>
          <span class="chapter-name">{{ chapter.title }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧：内容区域 -->
    <div class="content-area" v-if="currentChapter">
      <div class="content-header">
        <div class="header-title">
          <h2>{{ currentChapter.title }}</h2>
          <span class="breadcrumb">{{ currentCourse.name }} / {{ currentChapter.title }}</span>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="showEditModal = true">编辑章节</button>
          <button class="btn-primary" @click="showAddModal = true">+ 添加章节</button>
        </div>
      </div>

      <div class="content-body">
        <!-- 章节内容 -->
        <div class="chapter-content">
          <div class="content-rendered" v-html="renderMarkdown(currentChapter.content)"></div>
        </div>

        <!-- 个人笔记 -->
        <div class="personal-notes">
          <div class="notes-header">
            <h3>📝 我的笔记</h3>
            <button class="btn-small" @click="saveNotes">保存笔记</button>
          </div>
          <textarea
            v-model="currentChapter.personalNotes"
            class="notes-editor"
            placeholder="记录你的学习心得、疑问和批注..."
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else-if="!currentCourse">
      <div class="empty-icon">📚</div>
      <h3>选择一门课程开始学习</h3>
      <p>内置了 C语言、Python、网络工程、操作系统等课程</p>
    </div>
    <div class="empty-state" v-else>
      <div class="empty-icon">📖</div>
      <h3>选择一个章节</h3>
      <p>开始学习 {{ currentCourse.name }}</p>
    </div>

    <!-- 添加章节弹窗 -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>添加新章节</h3>
          <button class="close-btn" @click="showAddModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>章节标题</label>
            <input v-model="newChapter.title" type="text" placeholder="如：第1章 变量与数据类型" />
          </div>
          <div class="form-group">
            <label>章节内容 (支持 Markdown)</label>
            <textarea
              v-model="newChapter.content"
              class="content-textarea"
              placeholder="输入章节内容..."
              rows="10"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddModal = false">取消</button>
          <button class="btn-primary" @click="addChapter">添加</button>
        </div>
      </div>
    </div>

    <!-- 编辑章节弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>编辑章节</h3>
          <button class="close-btn" @click="showEditModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>章节标题</label>
            <input v-model="editChapterData.title" type="text" />
          </div>
          <div class="form-group">
            <label>章节内容 (支持 Markdown)</label>
            <textarea
              v-model="editChapterData.content"
              class="content-textarea"
              rows="15"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-danger" @click="deleteChapter">删除章节</button>
          <button class="btn-secondary" @click="showEditModal = false">取消</button>
          <button class="btn-primary" @click="updateChapter">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Chapter {
  id: number
  title: string
  content: string
  personalNotes: string
  completed: boolean
}

interface Course {
  id: number
  name: string
  icon: string
  chapters: Chapter[]
}

// 内置课程数据
const builtInCourses: Course[] = [
  {
    id: 1,
    name: 'C语言程序设计',
    icon: '🔷',
    chapters: [
      {
        id: 101,
        title: '第1章 C语言概述',
        content: `# C语言概述

## 1.1 C语言的发展历史

C语言由丹尼斯·里奇（Dennis Ritchie）于1972年在贝尔实验室开发，最初用于编写Unix操作系统。

## 1.2 C语言的特点

- **高效性**：接近底层硬件，执行效率高
- **可移植性**：代码可在不同平台编译运行
- **灵活性**：提供丰富的底层操作能力
- **广泛应用**：操作系统、嵌入式、驱动开发等

## 1.3 第一个C程序

\`\`\`c
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
\`\`\`

### 代码解析：
- \`#include <stdio.h>\`：包含标准输入输出库
- \`int main()\`：程序入口函数
- \`printf()\`：输出函数
- \`return 0\`：程序正常结束

## 1.4 编译运行

\`\`\`bash
# 编译
gcc hello.c -o hello

# 运行
./hello
\`\`\``,
        personalNotes: '',
        completed: false
      },
      {
        id: 102,
        title: '第2章 数据类型与变量',
        content: `# 数据类型与变量

## 2.1 基本数据类型

| 类型 | 说明 | 大小 | 范围 |
|------|------|------|------|
| char | 字符型 | 1字节 | -128 ~ 127 |
| int | 整型 | 4字节 | -2^31 ~ 2^31-1 |
| float | 单精度浮点 | 4字节 | 约6位有效数字 |
| double | 双精度浮点 | 8字节 | 约15位有效数字 |

## 2.2 变量定义与初始化

\`\`\`c
// 变量定义
int age;
float price;
char grade;

// 初始化
int count = 10;
float pi = 3.14159;
char letter = 'A';
\`\`\`

## 2.3 常量

\`\`\`c
// 字面常量
const int MAX_SIZE = 100;
#define PI 3.14159

// 枚举常量
enum Color { RED, GREEN, BLUE };
\`\`\`

## 2.4 类型转换

\`\`\`c
// 隐式转换
int a = 10;
float b = a;  // int → float

// 显式转换（强制类型转换）
float c = 3.7;
int d = (int)c;  // float → int，d = 3
\`\`\``,
        personalNotes: '',
        completed: false
      },
      {
        id: 103,
        title: '第3章 运算符与表达式',
        content: `# 运算符与表达式

## 3.1 算术运算符

\`\`\`c
int a = 10, b = 3;

int sum = a + b;      // 13
int diff = a - b;     // 7
int product = a * b;  // 30
int quotient = a / b; // 3（整数除法）
int remainder = a % b; // 1（取模）
\`\`\`

## 3.2 关系运算符

\`\`\`c
a > b   // 大于
a < b   // 小于
a >= b  // 大于等于
a <= b  // 小于等于
a == b  // 等于
a != b  // 不等于
\`\`\`

## 3.3 逻辑运算符

\`\`\`c
// && 逻辑与
// || 逻辑或
// !  逻辑非

if (age >= 18 && age <= 60) {
    printf("劳动年龄\\n");
}
\`\`\`

## 3.4 位运算符

\`\`\`c
// &  按位与
// |  按位或
// ^  按位异或
// ~  按位取反
// << 左移
// >> 右移

int x = 5;   // 二进制: 101
int y = 3;   // 二进制: 011
int z = x & y;  // 结果: 1 (001)
\`\`\``,
        personalNotes: '',
        completed: false
      },
      {
        id: 104,
        title: '第4章 控制结构',
        content: `# 控制结构

## 4.1 条件语句

### if-else语句
\`\`\`c
int score = 85;

if (score >= 90) {
    printf("优秀\\n");
} else if (score >= 80) {
    printf("良好\\n");
} else if (score >= 60) {
    printf("及格\\n");
} else {
    printf("不及格\\n");
}
\`\`\`

### switch语句
\`\`\`c
int day = 3;

switch (day) {
    case 1: printf("星期一\\n"); break;
    case 2: printf("星期二\\n"); break;
    case 3: printf("星期三\\n"); break;
    default: printf("其他\\n");
}
\`\`\`

## 4.2 循环语句

### for循环
\`\`\`c
// 计算1到100的和
int sum = 0;
for (int i = 1; i <= 100; i++) {
    sum += i;
}
printf("Sum = %d\\n", sum);  // 5050
\`\`\`

### while循环
\`\`\`c
int i = 0;
while (i < 10) {
    printf("%d ", i);
    i++;
}
\`\`\`

### do-while循环
\`\`\`c
int i = 0;
do {
    printf("%d ", i);
    i++;
} while (i < 10);
\`\`\``,
        personalNotes: '',
        completed: false
      },
      {
        id: 105,
        title: '第5章 数组与指针',
        content: `# 数组与指针

## 5.1 数组

### 一维数组
\`\`\`c
int numbers[5] = {1, 2, 3, 4, 5};

// 遍历数组
for (int i = 0; i < 5; i++) {
    printf("%d ", numbers[i]);
}
\`\`\`

### 二维数组
\`\`\`c
int matrix[3][3] = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};
\`\`\`

## 5.2 指针

### 指针基础
\`\`\`c
int x = 10;
int *p = &x;  // p指向x的地址

printf("x的值: %d\\n", x);      // 10
printf("x的地址: %p\\n", &x);   // 地址
printf("p的值: %p\\n", p);      // 同上
printf("*p的值: %d\\n", *p);    // 10（解引用）
\`\`\`

### 指针与数组
\`\`\`c
int arr[5] = {10, 20, 30, 40, 50};
int *p = arr;  // 数组名即首元素地址

// 以下等价
printf("%d\\n", arr[0]);   // 10
printf("%d\\n", *p);       // 10
printf("%d\\n", *(arr+1)); // 20
printf("%d\\n", p[1]);     // 20
\`\`\`

## 5.3 动态内存分配

\`\`\`c
#include <stdlib.h>

// 分配内存
int *arr = (int *)malloc(5 * sizeof(int));

// 使用内存
for (int i = 0; i < 5; i++) {
    arr[i] = i + 1;
}

// 释放内存
free(arr);
\`\`\``,
        personalNotes: '',
        completed: false
      }
    ]
  },
  {
    id: 2,
    name: 'Python编程',
    icon: '🐍',
    chapters: [
      {
        id: 201,
        title: '第1章 Python基础',
        content: `# Python基础

## 1.1 Python简介

Python是一种解释型、面向对象、动态数据类型的高级程序设计语言。

### 特点：
- 简洁优雅的语法
- 丰富的标准库
- 跨平台
- 适合快速开发

## 1.2 环境搭建

\`\`\`bash
# 检查Python版本
python --version

# 运行Python脚本
python hello.py
\`\`\`

## 1.3 第一个Python程序

\`\`\`python
print("Hello, World!")
\`\`\`

## 1.4 基本数据类型

\`\`\`python
# 数字
integer = 10
floating = 3.14
complex_num = 3 + 4j

# 字符串
name = "Python"
multiline = '''多行
字符串'''

# 布尔值
flag = True  # 或 False

# 空值
nothing = None
\`\`\``,
        personalNotes: '',
        completed: false
      },
      {
        id: 202,
        title: '第2章 数据结构',
        content: `# Python数据结构

## 2.1 列表（List）

\`\`\`python
# 创建列表
fruits = ["apple", "banana", "cherry"]
numbers = [1, 2, 3, 4, 5]
mixed = [1, "hello", 3.14, True]

# 列表操作
fruits.append("orange")      # 添加元素
fruits.insert(1, "mango")    # 插入元素
fruits.remove("banana")      # 删除元素
last = fruits.pop()          # 弹出最后一个

# 切片
sublist = numbers[1:4]       # [2, 3, 4]
reversed_list = numbers[::-1] # [5, 4, 3, 2, 1]
\`\`\`

## 2.2 元组（Tuple）

\`\`\`python
# 元组是不可变的
coordinates = (10, 20)
person = ("Alice", 25, "Engineer")

# 解包
x, y = coordinates
name, age, job = person
\`\`\`

## 2.3 字典（Dictionary）

\`\`\`python
# 创建字典
student = {
    "name": "张三",
    "age": 20,
    "grade": "A"
}

# 访问和修改
print(student["name"])       # 张三
student["age"] = 21          # 修改
student["major"] = "CS"      # 添加

# 遍历
for key, value in student.items():
    print(f"{key}: {value}")
\`\`\`

## 2.4 集合（Set）

\`\`\`python
# 创建集合
numbers = {1, 2, 3, 4, 5}

# 集合操作
a = {1, 2, 3}
b = {3, 4, 5}

union = a | b          # 并集: {1, 2, 3, 4, 5}
intersection = a & b   # 交集: {3}
difference = a - b     # 差集: {1, 2}
\`\`\``,
        personalNotes: '',
        completed: false
      },
      {
        id: 203,
        title: '第3章 函数与模块',
        content: `# 函数与模块

## 3.1 定义函数

\`\`\`python
# 基本函数
def greet(name):
    """函数的文档字符串（docstring）"""
    return f"Hello, {name}!"

# 调用函数
message = greet("Python")
print(message)  # Hello, Python!

# 默认参数
def power(base, exponent=2):
    return base ** exponent

print(power(3))      # 9  (3²)
print(power(2, 3))   # 8  (2³)
\`\`\`

## 3.2 匿名函数（Lambda）

\`\`\`python
# Lambda表达式
square = lambda x: x ** 2
print(square(5))  # 25

# 与高阶函数结合
numbers = [1, 2, 3, 4, 5]
squared = list(map(lambda x: x ** 2, numbers))
print(squared)  # [1, 4, 9, 16, 25]
\`\`\`

## 3.3 模块导入

\`\`\`python
# 导入整个模块
import math
print(math.sqrt(16))  # 4.0

# 导入特定函数
from random import randint, choice
print(randint(1, 100))

# 导入并设置别名
import numpy as np
import pandas as pd
\`\`\`

## 3.4 文件操作

\`\`\`python
# 读取文件
with open('data.txt', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = f.readlines()

# 写入文件
with open('output.txt', 'w', encoding='utf-8') as f:
    f.write("Hello, World!\\n")
    f.writelines(["Line 1\\n", "Line 2\\n"])
\`\`\``,
        personalNotes: '',
        completed: false
      }
    ]
  },
  {
    id: 3,
    name: '网络工程',
    icon: '🌐',
    chapters: [
      {
        id: 301,
        title: '第1章 网络基础',
        content: `# 计算机网络基础

## 1.1 OSI七层模型

| 层级 | 名称 | 功能 | 协议/设备 |
|------|------|------|-----------|
| 7 | 应用层 | 为用户应用提供服务 | HTTP, FTP, SMTP |
| 6 | 表示层 | 数据格式转换 | SSL/TLS |
| 5 | 会话层 | 建立、管理、终止会话 | NetBIOS |
| 4 | 传输层 | 端到端连接 | TCP, UDP |
| 3 | 网络层 | 路由和寻址 | IP, ICMP, 路由器 |
| 2 | 数据链路层 | 帧传输 | MAC, 交换机 |
| 1 | 物理层 | 比特流传输 | 网线、光纤、集线器 |

## 1.2 TCP/IP四层模型

\`\`\`
应用层  → HTTP, FTP, DNS
传输层  → TCP, UDP
网络层  → IP, ICMP, ARP
网络接口层 → 以太网, Wi-Fi
\`\`\`

## 1.3 IP地址

### IPv4地址
\`\`\`
格式：32位，点分十进制表示
示例：192.168.1.1

分类：
- A类：1.0.0.0 ~ 126.255.255.255
- B类：128.0.0.0 ~ 191.255.255.255
- C类：192.0.0.0 ~ 223.255.255.255
\`\`\`

### 子网掩码
\`\`\`
作用：划分网络地址和主机地址
示例：255.255.255.0 (/24)

网络地址 = IP地址 & 子网掩码
\`\`\``,
        personalNotes: '',
        completed: false
      },
      {
        id: 302,
        title: '第2章 TCP与UDP',
        content: `# TCP与UDP协议

## 2.1 TCP特点

- **面向连接**：三次握手建立连接
- **可靠传输**：确认机制、重传机制
- **流量控制**：滑动窗口
- **拥塞控制**：慢启动、拥塞避免

## 2.2 TCP三次握手

\`\`\`
客户端                    服务器
   |    SYN=1, seq=x      |
   | --------------------> |
   |                       |
   |  SYN=1, ACK=1, seq=y  |
   |  ack=x+1             |
   | <-------------------- |
   |                       |
   |    ACK=1, seq=x+1     |
   |    ack=y+1           |
   | --------------------> |
   |                       |
   |      连接建立          |
\`\`\`

## 2.3 UDP特点

- **无连接**：直接发送数据
- **不可靠**：不保证送达
- **低开销**：头部仅8字节
- **适用场景**：视频流、DNS、实时游戏

## 2.4 TCP vs UDP

| 特性 | TCP | UDP |
|------|-----|-----|
| 连接 | 面向连接 | 无连接 |
| 可靠性 | 可靠 | 不可靠 |
| 顺序 | 保证 | 不保证 |
| 开销 | 大（20字节头部） | 小（8字节头部） |
| 速度 | 较慢 | 快 |
| 应用 | HTTP, FTP, SMTP | DNS, VoIP, 视频流 |`,
        personalNotes: '',
        completed: false
      },
      {
        id: 303,
        title: '第3章 路由与交换',
        content: `# 路由与交换技术

## 3.1 交换机工作原理

### MAC地址表
\`\`\`
交换机通过学习源MAC地址建立转发表：

MAC地址          端口    时间戳
00:11:22:33:44:55  1     10:00
AA:BB:CC:DD:EE:FF  2     10:05
\`\`\`

### 转发方式
1. **单播**：目的MAC已知，直接转发到对应端口
2. **广播**：目的MAC为FF:FF:FF:FF:FF:FF，转发到所有端口
3. **未知单播**：MAC表中没有，泛洪到所有端口

## 3.2 VLAN技术

\`\`\`
VLAN（虚拟局域网）：
- 逻辑分割网络
- 提高安全性
- 减少广播域

VLAN类型：
- 基于端口（Port-based）
- 基于MAC地址
- 基于协议
- 基于子网
\`\`\`

## 3.3 路由基础

### 路由表
\`\`\`
Destination     Gateway         Genmask         Flags   Interface
0.0.0.0         192.168.1.1     0.0.0.0         UG      eth0
192.168.1.0     0.0.0.0         255.255.255.0   U       eth0
10.0.0.0        192.168.1.2     255.0.0.0       UG      eth0
\`\`\`

### 路由协议

| 类型 | 协议 | 特点 |
|------|------|------|
| 静态路由 | - | 手动配置，适合小型网络 |
| 距离矢量 | RIP | 跳数作为度量，最大15跳 |
| 链路状态 | OSPF | 基于Dijkstra算法，收敛快 |
| 路径向量 | BGP | 用于自治系统间路由 |`,
        personalNotes: '',
        completed: false
      }
    ]
  },
  {
    id: 4,
    name: '操作系统',
    icon: '⚙️',
    chapters: [
      {
        id: 401,
        title: '第1章 操作系统概述',
        content: `# 操作系统概述

## 1.1 什么是操作系统

操作系统（Operating System, OS）是管理计算机硬件与软件资源的系统软件。

### 主要功能：
- **进程管理**：创建、调度、终止进程
- **内存管理**：分配、回收、虚拟内存
- **文件系统**：组织、存储、访问文件
- **设备管理**：驱动程序、I/O控制
- **用户接口**：命令行、图形界面

## 1.2 操作系统类型

| 类型 | 特点 | 代表 |
|------|------|------|
| 批处理系统 | 自动执行作业序列 | 早期IBM OS |
| 分时系统 | 多用户轮流使用CPU | Unix, Linux |
| 实时系统 | 严格时间约束 | VxWorks, RT-Linux |
| 嵌入式系统 | 专用、资源受限 | FreeRTOS |
| 分布式系统 | 多台计算机协同 | Kubernetes |

## 1.3 系统调用

\`\`\`c
// 进程控制
fork()    // 创建子进程
exec()    // 执行新程序
exit()    // 终止进程
wait()    // 等待子进程结束

// 文件操作
open()    // 打开文件
read()    // 读取文件
write()   // 写入文件
close()   // 关闭文件

// 设备管理
ioctl()   // 设备控制
\`\`\``,
        personalNotes: '',
        completed: false
      },
      {
        id: 402,
        title: '第2章 进程管理',
        content: `# 进程管理

## 2.1 进程与线程

### 进程（Process）
- 资源分配的基本单位
- 拥有独立的地址空间
- 创建、切换开销大

### 线程（Thread）
- CPU调度的基本单位
- 共享进程资源
- 创建、切换开销小

\`\`\`
进程 = 代码段 + 数据段 + 堆栈段 + PCB
线程 = 线程ID + 程序计数器 + 寄存器 + 堆栈
\`\`\`

## 2.2 进程状态

\`\`\`
        创建
         |
         v
    [就绪态] <------ 时间片到 ------ [运行态]
         |                              |
         |---------- 调度 ------------->|
         |                              |
         |<----- 等待事件/I/O -------- [阻塞态]
         |                              |
         |---------- 事件发生 --------->|
         v
       终止
\`\`\`

## 2.3 进程调度算法

### 先来先服务（FCFS）
\`\`\`
优点：实现简单
缺点：平均等待时间长，护航效应
\`\`\`

### 短作业优先（SJF）
\`\`\`
优点：平均等待时间最短
缺点：需要预知运行时间，可能饥饿
\`\`\`

### 时间片轮转（RR）
\`\`\`
时间片大小选择：
- 太大 → 退化为FCFS
- 太小 → 上下文切换开销大
- 通常：10-100ms
\`\`\`

### 优先级调度
\`\`\`
优先级类型：
- 静态优先级：创建时确定
- 动态优先级：根据执行情况调整

问题：优先级反转
解决：优先级继承
\`\`\`

## 2.4 进程间通信（IPC）

| 方式 | 特点 | 适用场景 |
|------|------|----------|
| 管道 | 半双工，父子进程 | 简单数据传递 |
| 消息队列 | 消息为单位，异步 | 解耦通信 |
| 共享内存 | 最快，需同步 | 大数据量 |
| 信号量 | 同步机制 | 资源控制 |
| 套接字 | 可跨网络 | 分布式系统 |
| 信号 | 异步通知 | 事件处理 |`,
        personalNotes: '',
        completed: false
      },
      {
        id: 403,
        title: '第3章 内存管理',
        content: `# 内存管理

## 3.1 内存分配方式

### 连续分配
\`\`\`
单一连续分配：整个内存给单个程序
固定分区：内存分成固定大小分区
动态分区：按需分配，产生碎片
\`\`\`

### 非连续分配
\`\`\`
分页：物理内存分成固定大小页框
分段：按逻辑意义划分段
段页式：结合两者优点
\`\`\`

## 3.2 虚拟内存

### 基本概念
\`\`\`
虚拟地址空间 >> 物理内存
通过页表映射
按需调页（Demand Paging）
\`\`\`

### 页面置换算法

**最佳置换（OPT）**
\`\`\`
置换未来最长时间不使用的页面
理论最优，无法实现（需预知未来）
\`\`\`

**先进先出（FIFO）**
\`\`\`
Belady异常：物理页增加，缺页率反而增加
\`\`\`

**最近最少使用（LRU）**
\`\`\`
基于局部性原理
实现：计数器或栈
近似：Clock算法
\`\`\`

## 3.3 页表结构

### 多级页表
\`\`\`
页目录 → 页表 → 物理页框

优点：
- 节省内存（只需加载使用的页表）
- 支持大地址空间

缺点：
- 增加访存次数
- TLB可缓解
\`\`\`

### 快表（TLB）
\`\`\`
Translation Lookaside Buffer
缓存最近使用的页表项
命中率通常 > 90%
\`\`\``,
        personalNotes: '',
        completed: false
      }
    ]
  }
]

const courses = ref<Course[]>([])
const currentCourse = ref<Course | null>(null)
const currentChapter = ref<Chapter | null>(null)
const showAddModal = ref(false)
const showEditModal = ref(false)
const coursesCollapsed = ref(false)
const chaptersCollapsed = ref(false)

const newChapter = ref({ title: '', content: '' })
const editChapterData = ref({ title: '', content: '' })

// 简单的Markdown渲染
function renderMarkdown(content: string): string {
  if (!content) return ''
  
  return content
    // 代码块
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // 标题
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // 粗体和斜体
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // 行内代码
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // 列表
    .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
    // 表格（简化处理）
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim())
      return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>'
    })
    // 换行
    .replace(/\n/g, '<br>')
}

function selectCourse(course: Course) {
  currentCourse.value = course
  currentChapter.value = null
}

function selectChapter(chapter: Chapter) {
  currentChapter.value = chapter
  editChapterData.value = { 
    title: chapter.title, 
    content: chapter.content 
  }
}

function toggleComplete(chapter: Chapter) {
  chapter.completed = !chapter.completed
  saveCourses()
}

function getProgress(course: Course): number {
  if (!course.chapters.length) return 0
  const completed = course.chapters.filter(c => c.completed).length
  return Math.round((completed / course.chapters.length) * 100)
}

function addChapter() {
  if (!newChapter.value.title || !currentCourse.value) return
  
  currentCourse.value.chapters.push({
    id: Date.now(),
    title: newChapter.value.title,
    content: newChapter.value.content,
    personalNotes: '',
    completed: false
  })
  
  showAddModal.value = false
  newChapter.value = { title: '', content: '' }
  saveCourses()
}

function updateChapter() {
  if (!currentChapter.value) return
  
  currentChapter.value.title = editChapterData.value.title
  currentChapter.value.content = editChapterData.value.content
  
  showEditModal.value = false
  saveCourses()
}

function deleteChapter() {
  if (!currentChapter.value || !currentCourse.value) return
  if (!confirm('确定要删除这个章节吗？')) return
  
  const index = currentCourse.value.chapters.findIndex(
    c => c.id === currentChapter.value?.id
  )
  if (index > -1) {
    currentCourse.value.chapters.splice(index, 1)
    currentChapter.value = null
    showEditModal.value = false
    saveCourses()
  }
}

function saveNotes() {
  saveCourses()
  alert('笔记已保存')
}

function saveCourses() {
  localStorage.setItem('cs_learning_courses', JSON.stringify(courses.value))
}

function loadCourses() {
  const saved = localStorage.getItem('cs_learning_courses')
  if (saved) {
    courses.value = JSON.parse(saved)
  } else {
    courses.value = JSON.parse(JSON.stringify(builtInCourses))
  }
}

onMounted(() => {
  loadCourses()
})
</script>

<style scoped>
.learning-page {
  display: flex;
  height: calc(100vh - 64px);
  background: var(--bg-primary);
}

/* 侧边栏样式 */
.courses-sidebar,
.chapters-sidebar {
  width: 260px;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.chapters-sidebar {
  width: 280px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.sidebar-header h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

/* 课程列表 */
.course-list,
.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.course-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.course-item:hover,
.course-item.active {
  background: var(--accent-primary-bg);
}

.course-item.active .course-name {
  color: var(--accent-primary);
  font-weight: var(--font-weight-medium);
}

.course-icon {
  font-size: 24px;
}

.course-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.course-name {
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

.course-progress {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 章节列表 */
.chapter-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.chapter-item:hover,
.chapter-item.active {
  background: var(--accent-primary-bg);
}

.chapter-item.completed .chapter-name {
  text-decoration: line-through;
  color: var(--text-muted);
}

.chapter-check {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 14px;
}

.chapter-item.completed .chapter-check {
  color: var(--success);
}

.chapter-name {
  flex: 1;
  color: var(--text-primary);
  font-size: var(--font-size-sm);
}

/* 内容区域 */
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--border);
  background: var(--bg-card);
}

.header-title h2 {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-1);
}

.breadcrumb {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.header-actions {
  display: flex;
  gap: var(--space-3);
}

.content-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
}

/* 章节内容 */
.chapter-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-card);
}

.content-rendered {
  line-height: 1.8;
  color: var(--text-primary);
}

.content-rendered h1 {
  font-size: var(--font-size-2xl);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 2px solid var(--border);
}

.content-rendered h2 {
  font-size: var(--font-size-xl);
  margin-top: var(--space-6);
  margin-bottom: var(--space-3);
  color: var(--accent-primary);
}

.content-rendered h3 {
  font-size: var(--font-size-lg);
  margin-top: var(--space-4);
  margin-bottom: var(--space-2);
}

.content-rendered pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: var(--space-3) 0;
}

.content-rendered code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

.content-rendered pre code {
  background: none;
  padding: 0;
}

.content-rendered p code {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: var(--accent-primary);
}

.content-rendered table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--space-3) 0;
}

.content-rendered td,
.content-rendered th {
  border: 1px solid var(--border);
  padding: var(--space-2) var(--space-3);
  text-align: left;
}

.content-rendered tr:nth-child(even) {
  background: var(--bg-secondary);
}

.content-rendered li {
  margin: var(--space-2) 0;
  margin-left: var(--space-4);
}

/* 个人笔记 */
.personal-notes {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);
}

.notes-header h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.notes-editor {
  width: 100%;
  min-height: 150px;
  padding: var(--space-3);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
  resize: vertical;
  box-sizing: border-box;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  text-align: center;
  padding: var(--space-8);
}

.empty-icon {
  font-size: 80px;
  margin-bottom: var(--space-4);
}

.empty-state h3 {
  font-size: var(--font-size-xl);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.modal-content {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4);
  border-bottom: 1px solid var(--border);
}

.modal-header h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.close-btn {
  font-size: 24px;
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
}

.modal-body {
  padding: var(--space-4);
}

.form-group {
  margin-bottom: var(--space-4);
}

.form-group label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.form-group input,
.content-textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  box-sizing: border-box;
}

.content-textarea {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4);
  border-top: 1px solid var(--border);
}

/* 按钮样式 */
.btn-secondary,
.btn-primary,
.btn-danger,
.btn-small {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-secondary {
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

.btn-primary {
  color: var(--text-inverse);
  background: var(--accent-primary);
  border: none;
}

.btn-primary:hover {
  background: var(--accent-primary-hover);
}

.btn-danger {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  border: none;
  margin-right: auto;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.btn-small {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--accent-primary);
  background: var(--accent-primary-bg);
  border: none;
}

.btn-small:hover {
  background: var(--accent-primary);
  color: var(--text-inverse);
}

/* 折叠按钮样式 */
.collapse-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--accent-primary-bg);
  color: var(--accent-primary);
}

/* 侧边栏折叠状态 */
.courses-sidebar,
.chapters-sidebar {
  transition: width 0.3s ease;
}

.courses-sidebar.collapsed {
  width: 60px;
}

.chapters-sidebar.collapsed {
  width: 60px;
}

.courses-sidebar.collapsed .course-item,
.chapters-sidebar.collapsed .chapter-item {
  justify-content: center;
  padding: var(--space-2);
}

.courses-sidebar.collapsed .course-icon {
  margin: 0;
}

@media (max-width: 1024px) {
  .courses-sidebar {
    width: 200px;
  }
  
  .chapters-sidebar {
    width: 220px;
  }
}

@media (max-width: 768px) {
  .learning-page {
    flex-direction: column;
    height: auto;
  }
  
  .courses-sidebar,
  .chapters-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border);
    max-height: 200px;
  }
}
</style>
