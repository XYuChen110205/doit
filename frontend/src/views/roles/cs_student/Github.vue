<template>
  <div class="github-learning-page">
    <!-- 左侧：项目分类 -->
    <div class="projects-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <h3 v-show="!sidebarCollapsed">开源项目</h3>
        <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
          {{ sidebarCollapsed ? '→' : '←' }}
        </button>
      </div>
      <div class="project-list" v-show="!sidebarCollapsed">
        <div
          v-for="project in projects"
          :key="project.id"
          class="project-item"
          :class="{ active: currentProject?.id === project.id }"
          @click="selectProject(project)"
        >
          <span class="project-icon">{{ project.icon }}</span>
          <div class="project-info">
            <span class="project-name">{{ project.name }}</span>
            <span class="project-category">{{ project.category }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 中间：文件/模块列表 -->
    <div class="files-sidebar" v-if="currentProject" :class="{ collapsed: filesCollapsed }">
      <div class="sidebar-header">
        <h3 v-show="!filesCollapsed">{{ currentProject.name }}</h3>
        <button class="collapse-btn" @click="filesCollapsed = !filesCollapsed">
          {{ filesCollapsed ? '→' : '←' }}
        </button>
      </div>
      <div class="file-tree" v-show="!filesCollapsed">
        <div
          v-for="file in currentProject.files"
          :key="file.id"
          class="file-item"
          :class="{ active: currentFile?.id === file.id }"
          @click="selectFile(file)"
        >
          <span class="file-icon">{{ getFileIcon(file.type) }}</span>
          <span class="file-name">{{ file.name }}</span>
        </div>
      </div>
    </div>

    <!-- 右侧：代码详情 -->
    <div class="content-area" v-if="currentFile">
      <div class="content-header">
        <div class="header-title">
          <h2>{{ currentFile.name }}</h2>
          <span class="breadcrumb">{{ currentProject.name }} / {{ currentFile.path }}</span>
        </div>
        <div class="header-actions">
          <a :href="currentProject.githubUrl" target="_blank" class="btn-secondary">
            🔗 GitHub 仓库
          </a>
        </div>
      </div>

      <div class="content-body">
        <!-- 文件说明 -->
        <div class="file-description" v-if="currentFile.description">
          <h3>📋 文件说明</h3>
          <div class="description-content" v-html="renderMarkdown(currentFile.description)"></div>
        </div>

        <!-- 软件工程分析 -->
        <div class="analysis-section" v-if="currentFile.analysis">
          <h3>🔍 软件工程分析</h3>
          <div class="analysis-content" v-html="renderMarkdown(currentFile.analysis)"></div>
        </div>

        <!-- 代码实现 -->
        <div class="code-section" v-if="currentFile.code">
          <h3>💻 核心代码</h3>
          <div class="code-header">
            <span class="code-lang">{{ currentFile.language }}</span>
            <button class="copy-btn" @click="copyCode">复制</button>
          </div>
          <pre class="code-block"><code>{{ currentFile.code }}</code></pre>
        </div>

        <!-- 关键概念解释 -->
        <div class="concepts-section" v-if="currentFile.concepts?.length">
          <h3>📚 关键概念</h3>
          <div class="concepts-list">
            <div v-for="(concept, index) in currentFile.concepts" :key="index" class="concept-card">
              <div class="concept-term">{{ concept.term }}</div>
              <div class="concept-explanation">{{ concept.explanation }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else-if="!currentProject">
      <div class="empty-icon">🌟</div>
      <h3>选择一个开源项目学习</h3>
      <p>内置了数字孪生、OpenClaw、智能化操作系统等领域的优秀项目</p>
    </div>
    <div class="empty-state" v-else>
      <div class="empty-icon">📁</div>
      <h3>选择一个文件查看</h3>
      <p>学习 {{ currentProject.name }} 的代码实现</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Concept {
  term: string
  explanation: string
}

interface ProjectFile {
  id: number
  name: string
  path: string
  type: 'file' | 'folder'
  language: string
  description: string
  analysis: string
  code: string
  concepts: Concept[]
}

interface Project {
  id: number
  name: string
  icon: string
  category: string
  githubUrl: string
  description: string
  files: ProjectFile[]
}

// 内置开源项目数据
const builtInProjects: Project[] = [
  {
    id: 1,
    name: 'Digital Twin Platform',
    icon: '🏭',
    category: '数字孪生',
    githubUrl: 'https://github.com/example/digital-twin-platform',
    description: '一个工业级数字孪生平台，用于实时监控和模拟物理设备',
    files: [
      {
        id: 101,
        name: 'TwinCore.ts',
        path: 'src/core/TwinCore.ts',
        type: 'file',
        language: 'TypeScript',
        description: '数字孪生核心引擎，负责物理实体与数字模型的同步',
        analysis: `## 架构设计模式

### 1. 观察者模式 (Observer Pattern)
- **用途**：实现物理设备状态变化时，自动更新数字模型
- **优点**：解耦物理层和数字层，支持多对多通信
- **实现**：使用 EventEmitter 实现事件订阅机制

### 2. 单例模式 (Singleton Pattern)
- **用途**：确保整个应用只有一个 TwinCore 实例
- **优点**：统一管理所有孪生对象，避免状态不一致

### 3. 工厂模式 (Factory Pattern)
- **用途**：根据设备类型创建对应的数字孪生对象
- **优点**：便于扩展新的设备类型`,
        code: `class TwinCore {
  private static instance: TwinCore;
  private twins: Map<string, DigitalTwin> = new Map();
  private eventEmitter: EventEmitter;

  private constructor() {
    this.eventEmitter = new EventEmitter();
  }

  // 单例模式获取实例
  static getInstance(): TwinCore {
    if (!TwinCore.instance) {
      TwinCore.instance = new TwinCore();
    }
    return TwinCore.instance;
  }

  // 创建数字孪生对象（工厂模式）
  createTwin(deviceId: string, deviceType: string): DigitalTwin {
    const twin = TwinFactory.create(deviceType, deviceId);
    this.twins.set(deviceId, twin);
    
    // 订阅物理设备数据更新
    this.subscribeToPhysicalDevice(deviceId, (data) => {
      twin.updateState(data);
      this.eventEmitter.emit('twin:updated', { deviceId, data });
    });
    
    return twin;
  }

  // 获取孪生对象状态
  getTwinState(deviceId: string): TwinState | null {
    const twin = this.twins.get(deviceId);
    return twin ? twin.getState() : null;
  }

  // 模拟预测（基于历史数据的机器学习预测）
  async predict(deviceId: string, horizon: number): Promise<Prediction> {
    const twin = this.twins.get(deviceId);
    if (!twin) throw new Error('Twin not found');
    
    const historicalData = twin.getHistoricalData();
    return this.mlModel.predict(historicalData, horizon);
  }
}`,
        concepts: [
          {
            term: 'Digital Twin（数字孪生）',
            explanation: '物理实体在数字世界的精确映射，能够实时同步状态并进行预测分析'
          },
          {
            term: 'EventEmitter',
            explanation: 'Node.js 的事件触发器，用于实现发布-订阅模式的事件处理机制'
          },
          {
            term: '工厂模式',
            explanation: '创建型设计模式，通过工厂方法创建对象，而不是直接使用 new 关键字'
          }
        ]
      },
      {
        id: 102,
        name: 'DataSync.ts',
        path: 'src/sync/DataSync.ts',
        type: 'file',
        language: 'TypeScript',
        description: '数据同步模块，处理物理设备与数字模型之间的实时数据同步',
        analysis: `## 实时数据同步架构

### 1. WebSocket 长连接
- **用途**：实现服务器与客户端的实时双向通信
- **优势**：相比 HTTP 轮询，减少延迟和带宽消耗

### 2. 数据缓冲与批量处理
- **用途**：处理高频数据更新，避免频繁渲染
- **策略**：使用防抖（Debounce）和节流（Throttle）技术

### 3. 数据一致性保证
- **乐观锁**：版本号机制防止并发冲突
- **数据校验**：CRC32 校验确保数据完整性`,
        code: `class DataSync {
  private ws: WebSocket;
  private buffer: DataBuffer;
  private updateQueue: UpdateQueue;

  constructor(endpoint: string) {
    this.ws = new WebSocket(endpoint);
    this.buffer = new DataBuffer(1000); // 缓冲区大小1000条
    this.updateQueue = new UpdateQueue();
    this.initWebSocket();
  }

  private initWebSocket(): void {
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // 数据校验
      if (!this.validateData(data)) {
        console.error('Data validation failed:', data);
        return;
      }

      // 加入缓冲区（防抖处理）
      this.buffer.add(data);
      
      // 批量处理（每50ms处理一次）
      this.debounceProcess();
    };
  }

  // 防抖处理：避免高频更新导致UI卡顿
  private debounceProcess = debounce(() => {
    const batch = this.buffer.flush();
    this.processBatch(batch);
  }, 50);

  // 批量处理数据更新
  private processBatch(batch: SensorData[]): void {
    batch.forEach(data => {
      const twin = TwinCore.getInstance().getTwin(data.deviceId);
      if (twin) {
        // 乐观更新：先更新UI，再确认
        twin.optimisticUpdate(data);
        
        // 发送确认消息
        this.ws.send(JSON.stringify({
          type: 'ack',
          deviceId: data.deviceId,
          timestamp: data.timestamp
        }));
      }
    });
  }

  // 数据完整性校验
  private validateData(data: SensorData): boolean {
    // CRC32 校验
    const checksum = crc32(JSON.stringify(data.payload));
    return checksum === data.checksum;
  }
}`,
        concepts: [
          {
            term: 'WebSocket',
            explanation: '在单个 TCP 连接上进行全双工通信的协议，适合实时数据传输'
          },
          {
            term: '防抖（Debounce）',
            explanation: '在事件触发后等待一段时间才执行，如果期间再次触发则重新计时'
          },
          {
            term: '乐观更新',
            explanation: '先更新UI显示，再异步确认服务器状态，提升用户体验'
          }
        ]
      }
    ]
  },
  {
    id: 2,
    name: 'OpenClaw Robot',
    icon: '🤖',
    category: '机器人控制',
    githubUrl: 'https://github.com/example/openclaw-robot',
    description: '开源机械臂控制系统，支持运动学求解和轨迹规划',
    files: [
      {
        id: 201,
        name: 'Kinematics.cpp',
        path: 'src/control/Kinematics.cpp',
        type: 'file',
        language: 'C++',
        description: '机械臂运动学求解器，包含正运动学和逆运动学实现',
        analysis: `## 机器人运动学

### 1. 正运动学（Forward Kinematics）
- **输入**：各关节角度（θ₁, θ₂, θ₃...）
- **输出**：末端执行器的位置和姿态
- **算法**：DH参数法（Denavit-Hartenberg）

### 2. 逆运动学（Inverse Kinematics）
- **输入**：目标位置和姿态
- **输出**：各关节角度
- **算法**：解析法 + 数值迭代法

### 3. 软件工程实践
- **模板元编程**：编译期优化矩阵运算
- **异常安全**：RAII 资源管理
- **单元测试**：Google Test 框架`,
        code: `#include <Eigen/Dense>
#include <vector>
#include <cmath>

class Kinematics {
private:
    std::vector<DHParameter> dhParams;
    
public:
    // DH 参数结构体
    struct DHParameter {
        double a;      // 连杆长度
        double alpha;  // 连杆扭角
        double d;      // 连杆偏距
        double theta;  // 关节角度
    };

    // 正运动学：计算末端位姿
    Eigen::Matrix4d forwardKinematics(const std::vector<double>& jointAngles) {
        Eigen::Matrix4d T = Eigen::Matrix4d::Identity();
        
        for (size_t i = 0; i < dhParams.size(); i++) {
            // 更新关节角度
            dhParams[i].theta = jointAngles[i];
            
            // 计算变换矩阵
            Eigen::Matrix4d Ti = computeTransformMatrix(dhParams[i]);
            T = T * Ti;
        }
        
        return T;
    }

    // 逆运动学：解析法求解
    std::vector<std::vector<double>> inverseKinematics(
        const Eigen::Vector3d& targetPos,
        const Eigen::Matrix3d& targetRot
    ) {
        std::vector<std::vector<double>> solutions;
        
        // 解析解（适用于6自由度机械臂）
        // 基于 Pieper 准则：最后三个关节轴交于一点
        
        // 1. 求解 wrist center 位置
        Eigen::Vector3d wristCenter = computeWristCenter(targetPos, targetRot);
        
        // 2. 求解前三个关节（位置）
        auto joint123Solutions = solveFirstThreeJoints(wristCenter);
        
        // 3. 求解后三个关节（姿态）
        for (const auto& j123 : joint123Solutions) {
            auto j456Solutions = solveLastThreeJoints(targetRot, j123);
            
            for (const auto& j456 : j456Solutions) {
                std::vector<double> solution = j123;
                solution.insert(solution.end(), j456.begin(), j456.end());
                
                // 验证解的有效性
                if (validateSolution(solution, targetPos, targetRot)) {
                    solutions.push_back(solution);
                }
            }
        }
        
        return solutions;
    }

private:
    // 计算 DH 变换矩阵
    Eigen::Matrix4d computeTransformMatrix(const DHParameter& dh) {
        Eigen::Matrix4d T;
        double ct = cos(dh.theta);
        double st = sin(dh.theta);
        double ca = cos(dh.alpha);
        double sa = sin(dh.alpha);
        
        T << ct, -st*ca,  st*sa, dh.a*ct,
             st,  ct*ca, -ct*sa, dh.a*st,
             0,   sa,     ca,    dh.d,
             0,   0,      0,     1;
        
        return T;
    }
};`,
        concepts: [
          {
            term: 'DH参数法',
            explanation: 'Denavit-Hartenberg 参数法，用4个参数描述相邻连杆的相对位置和姿态'
          },
          {
            term: '正运动学',
            explanation: '已知关节角度，计算末端执行器在空间的位姿（位置和姿态）'
          },
          {
            term: '逆运动学',
            explanation: '已知目标位姿，计算达到该位姿所需的关节角度，通常有多解'
          },
          {
            term: 'Eigen',
            explanation: 'C++ 的线性代数库，提供矩阵和向量运算，广泛用于机器人学'
          }
        ]
      },
      {
        id: 202,
        name: 'TrajectoryPlanner.py',
        path: 'src/planning/TrajectoryPlanner.py',
        type: 'file',
        language: 'Python',
        description: '轨迹规划器，实现平滑的运动轨迹生成',
        analysis: `## 轨迹规划算法

### 1. 三次样条插值（Cubic Spline）
- **用途**：生成平滑的位置曲线
- **优点**：位置、速度、加速度连续
- **应用**：点到点运动（PTP）

### 2. 梯形速度曲线（Trapezoidal Velocity Profile）
- **用途**：考虑电机加减速能力的轨迹
- **阶段**：加速段 → 匀速段 → 减速段

### 3. S曲线规划（S-Curve Profile）
- **用途**：限制加加速度（jerk），减少机械振动
- **优点**：更平滑，保护机械结构`,
        code: `import numpy as np
from scipy.interpolate import CubicSpline
from typing import List, Tuple

class TrajectoryPlanner:
    def __init__(self, max_velocity: float, max_acceleration: float):
        self.max_vel = max_velocity
        self.max_acc = max_acceleration
    
    def plan_cubic_spline(self, 
                          waypoints: List[np.ndarray], 
                          times: List[float]) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        三次样条轨迹规划
        
        Args:
            waypoints: 路径点列表，每个点是关节角度数组
            times: 每个路径点对应的时间
        
        Returns:
            positions: 位置序列
            velocities: 速度序列  
            accelerations: 加速度序列
        """
        waypoints = np.array(waypoints)
        n_joints = waypoints.shape[1]
        
        # 为每个关节单独计算样条
        splines = []
        for i in range(n_joints):
            cs = CubicSpline(times, waypoints[:, i])
            splines.append(cs)
        
        # 生成轨迹点
        t_fine = np.linspace(times[0], times[-1], 1000)
        positions = np.array([s(t_fine) for s in splines]).T
        velocities = np.array([s(t_fine, 1) for s in splines]).T  # 一阶导数
        accelerations = np.array([s(t_fine, 2) for s in splines]).T  # 二阶导数
        
        return positions, velocities, accelerations
    
    def plan_trapezoidal(self, 
                         start: np.ndarray, 
                         end: np.ndarray, 
                         duration: float) -> dict:
        """
        梯形速度曲线规划
        
        运动分为三个阶段：
        1. 加速段（0 ~ t1）：匀加速到最大速度
        2. 匀速段（t1 ~ t2）：以最大速度运动
        3. 减速段（t2 ~ T）：匀减速到0
        """
        distance = np.linalg.norm(end - start)
        
        # 判断是否能达到最大速度
        t_acc = self.max_vel / self.max_acc  # 加速时间
        d_acc = 0.5 * self.max_acc * t_acc**2  # 加速距离
        
        if 2 * d_acc >= distance:
            # 三角形速度曲线（达不到最大速度）
            t_acc = np.sqrt(distance / self.max_acc)
            t_const = 0
            actual_max_vel = self.max_acc * t_acc
        else:
            # 梯形速度曲线
            d_const = distance - 2 * d_acc
            t_const = d_const / self.max_vel
            actual_max_vel = self.max_vel
        
        total_time = 2 * t_acc + t_const
        
        return {
            't_acc': t_acc,
            't_const': t_const,
            'total_time': total_time,
            'max_velocity': actual_max_vel
        }
    
    def plan_sc_curve(self, 
                      start: np.ndarray, 
                      end: np.ndarray, 
                      duration: float,
                      max_jerk: float) -> np.ndarray:
        """
        S曲线轨迹规划（限制加加速度）
        
        7段式S曲线：加加速→匀加速→减加速→匀速→加减速→匀减速→减减速
        """
        # S曲线参数计算
        T_j = self.max_acc / max_jerk  # 加加速段时间
        
        # 检查是否达到最大加速度
        if self.max_vel < self.max_acc * (T_j + np.sqrt(T_j**2 + 
            4 * np.linalg.norm(end - start) / self.max_acc)) / 2:
            # 能达到最大速度的情况
            pass
        
        # 生成时间序列
        t = np.linspace(0, duration, 1000)
        trajectory = np.zeros((len(t), len(start)))
        
        for i, ti in enumerate(t):
            trajectory[i] = self._compute_sc_point(start, end, ti, duration, T_j)
        
        return trajectory
    
    def _compute_sc_point(self, start, end, t, T, T_j):
        """计算S曲线在某时刻的位置"""
        # 简化的S曲线计算
        # 实际实现需要考虑7个阶段的复杂逻辑
        normalized_t = t / T
        # 使用5次多项式近似S曲线
        s = 10 * normalized_t**3 - 15 * normalized_t**4 + 6 * normalized_t**5
        return start + s * (end - start)`,
        concepts: [
          {
            term: '三次样条插值',
            explanation: '使用分段三次多项式连接数据点，保证位置、速度、加速度的连续性'
          },
          {
            term: '梯形速度曲线',
            explanation: '速度曲线呈梯形，包含加速、匀速、减速三个阶段，简单高效'
          },
          {
            term: 'S曲线规划',
            explanation: '限制加加速度（jerk）的轨迹规划，使运动更加平滑，减少机械冲击'
          },
          {
            term: '加加速度（Jerk）',
            explanation: '加速度对时间的导数，表示加速度变化的快慢，限制jerk可保护机械结构'
          }
        ]
      }
    ]
  },
  {
    id: 3,
    name: 'SmartOS',
    icon: '💻',
    category: '智能化操作系统',
    githubUrl: 'https://github.com/example/smartos',
    description: '面向物联网的智能操作系统，支持边缘计算和AI推理',
    files: [
      {
        id: 301,
        name: 'Scheduler.c',
        path: 'kernel/Scheduler.c',
        type: 'file',
        language: 'C',
        description: '智能任务调度器，基于强化学习的动态优先级调整',
        analysis: `## 智能调度算法

### 1. 多级反馈队列（MLFQ）
- **原理**：多个优先级队列，任务在不同队列间移动
- **优点**：兼顾短任务和长任务，自动适应任务特性

### 2. 强化学习优化
- **状态**：系统负载、任务特性、历史执行时间
- **动作**：调整优先级、分配时间片
- **奖励**：吞吐量、响应时间、公平性

### 3. 实时性保证
- **EDF算法**：最早截止时间优先
- **Rate Monotonic**：速率单调调度`,
        code: `#include <scheduler.h>
#include <rl_model.h>

// 任务控制块
typedef struct {
    int pid;
    int priority;
    int time_slice;
    int deadline;
    TaskState state;
    RLState rl_state;
} TaskControlBlock;

// 多级反馈队列
#define NUM_QUEUES 5
typedef struct {
    TaskControlBlock* queues[NUM_QUEUES];
    int queue_sizes[NUM_QUEUES];
    int time_quantums[NUM_QUEUES];  // 不同队列的时间片
} MLFQScheduler;

// 强化学习模型
RLModel* rl_model;

// 初始化调度器
void scheduler_init() {
    // 初始化MLFQ
    for (int i = 0; i < NUM_QUEUES; i++) {
        mlfq.time_quantums[i] = 1 << (i + 4);  // 16, 32, 64, 128, 256ms
    }
    
    // 加载预训练的RL模型
    rl_model = rl_load_model("/models/scheduler_rl.onnx");
}

// 主调度函数
TaskControlBlock* schedule() {
    // 1. 检查实时任务（最高优先级）
    TaskControlBlock* realtime_task = get_earliest_deadline_task();
    if (realtime_task && realtime_task->deadline - get_current_time() < 10) {
        return realtime_task;  // 截止时间紧急
    }
    
    // 2. 使用MLFQ选择任务
    for (int i = 0; i < NUM_QUEUES; i++) {
        if (mlfq.queue_sizes[i] > 0) {
            TaskControlBlock* task = mlfq.queues[i][0];
            
            // 3. RL模型优化
            RLState state = get_system_state();
            RLAction action = rl_predict(rl_model, state);
            
            // 根据RL建议调整优先级
            int adjusted_priority = task->priority + action.priority_delta;
            adjusted_priority = clamp(adjusted_priority, 0, MAX_PRIORITY);
            
            task->priority = adjusted_priority;
            task->time_slice = mlfq.time_quantums[i];
            
            return task;
        }
    }
    
    return NULL;  // 空闲任务
}

// 任务完成或时间片用完后的处理
void update_task_priority(TaskControlBlock* task, int used_time) {
    int current_queue = get_queue_index(task);
    
    if (used_time >= task->time_slice) {
        // 时间片用完，降低优先级（移到更低优先级队列）
        if (current_queue < NUM_QUEUES - 1) {
            move_to_queue(task, current_queue + 1);
        }
    } else {
        // 任务主动放弃CPU（I/O操作），提升优先级
        if (current_queue > 0) {
            move_to_queue(task, current_queue - 1);
        }
    }
    
    // 记录数据用于RL模型训练
    record_transition(task->rl_state, task->priority, get_reward(task));
}

// 计算调度奖励（用于强化学习）
float get_reward(TaskControlBlock* task) {
    float throughput_reward = task->completed_work / task->cpu_time;
    float latency_penalty = task->waiting_time * 0.1;
    float deadline_penalty = (task->deadline < get_current_time()) ? 100 : 0;
    
    return throughput_reward - latency_penalty - deadline_penalty;
}`,
        concepts: [
          {
            term: 'MLFQ（多级反馈队列）',
            explanation: 'Multiple Level Feedback Queue，根据任务行为动态调整优先级的调度算法'
          },
          {
            term: '强化学习（RL）',
            explanation: '通过与环境交互学习最优策略，这里用于动态调整任务优先级'
          },
          {
            term: 'EDF调度',
            explanation: 'Earliest Deadline First，最早截止时间优先的实时调度算法'
          },
          {
            term: '时间片（Time Slice）',
            explanation: '进程每次占用CPU的最大时间，用完则强制切换，保证公平性'
          }
        ]
      }
    ]
  },
  {
    id: 4,
    name: 'PV Monitor',
    icon: '☀️',
    category: '光伏监控',
    githubUrl: 'https://github.com/example/pv-monitor',
    description: '光伏发电站智能监控系统，支持发电量预测和故障诊断',
    files: [
      {
        id: 401,
        name: 'PowerPredictor.py',
        path: 'src/ml/PowerPredictor.py',
        type: 'file',
        language: 'Python',
        description: '光伏发电量预测模型，基于LSTM神经网络',
        analysis: `## 光伏功率预测系统

### 1. 数据预处理
- **特征工程**：时间特征、天气特征、历史功率
- **归一化**：Min-Max标准化
- **序列构建**：滑动窗口创建训练样本

### 2. LSTM模型
- **输入**：过去24小时的气象和功率数据
- **输出**：未来1-72小时的功率预测
- **结构**：2层LSTM + Attention机制

### 3. 模型优化
- **早停法**：防止过拟合
- **学习率衰减**：自适应学习率
- **集成学习**：多模型融合`,
        code: `import torch
import torch.nn as nn
import numpy as np
from typing import Tuple, List

class AttentionLSTM(nn.Module):
    """
    带注意力机制的LSTM模型，用于光伏功率预测
    
    架构：
    - 输入层：多维特征（辐照度、温度、湿度、风速、历史功率）
    - LSTM层：捕捉时序依赖
    - Attention层：关注重要时间步
    - 全连接层：输出预测值
    """
    
    def __init__(self, input_size: int, hidden_size: int, num_layers: int, output_size: int):
        super(AttentionLSTM, self).__init__()
        
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        
        # LSTM层
        self.lstm = nn.LSTM(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.2 if num_layers > 1 else 0
        )
        
        # 注意力机制
        self.attention = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.Tanh(),
            nn.Linear(hidden_size // 2, 1)
        )
        
        # 输出层
        self.fc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size // 2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_size // 2, output_size)
        )
    
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        前向传播
        
        Args:
            x: 输入序列 [batch_size, seq_len, input_size]
        
        Returns:
            预测值 [batch_size, output_size]
        """
        # LSTM编码
        lstm_out, _ = self.lstm(x)  # [batch, seq_len, hidden]
        
        # 计算注意力权重
        attention_weights = self.attention(lstm_out)  # [batch, seq_len, 1]
        attention_weights = torch.softmax(attention_weights, dim=1)
        
        # 加权求和
        context = torch.sum(attention_weights * lstm_out, dim=1)  # [batch, hidden]
        
        # 输出预测
        output = self.fc(context)
        
        return output

class PowerPredictor:
    """光伏发电量预测器"""
    
    def __init__(self, model_path: str = None):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        # 模型参数
        self.input_size = 8  # 8个特征
        self.hidden_size = 128
        self.num_layers = 2
        self.output_size = 24  # 预测未来24小时
        self.seq_len = 72  # 使用过去72小时数据
        
        # 初始化模型
        self.model = AttentionLSTM(
            self.input_size, 
            self.hidden_size, 
            self.num_layers, 
            self.output_size
        ).to(self.device)
        
        if model_path:
            self.model.load_state_dict(torch.load(model_path))
        self.model.eval()
    
    def prepare_features(self, weather_data: dict, historical_power: List[float]) -> np.ndarray:
        """
        特征工程
        
        特征列表：
        1. 全局水平辐照度 (GHI)
        2. 直接法向辐照度 (DNI)
        3. 环境温度
        4. 相对湿度
        5. 风速
        6. 云量
        7. 历史功率（滞后1小时）
        8. 时间编码（小时、月份）
        """
        features = np.column_stack([
            weather_data['ghi'],
            weather_data['dni'],
            weather_data['temperature'],
            weather_data['humidity'],
            weather_data['wind_speed'],
            weather_data['cloud_cover'],
            historical_power,
            self._encode_time(weather_data['timestamp'])
        ])
        
        return features
    
    def _encode_time(self, timestamps: List) -> np.ndarray:
        """时间特征编码：正弦余弦变换保持周期性"""
        hours = np.array([t.hour for t in timestamps])
        months = np.array([t.month for t in timestamps])
        
        # 小时编码（24小时周期）
        hour_sin = np.sin(2 * np.pi * hours / 24)
        hour_cos = np.cos(2 * np.pi * hours / 24)
        
        # 月份编码（12个月周期）
        month_sin = np.sin(2 * np.pi * months / 12)
        month_cos = np.cos(2 * np.pi * months / 12)
        
        # 合并为单一时间特征
        return (hour_sin + hour_cos + month_sin + month_cos) / 4
    
    def predict(self, features: np.ndarray) -> np.ndarray:
        """
        预测未来24小时的发电量
        
        Args:
            features: [seq_len, input_size] 历史特征序列
        
        Returns:
            预测功率 [24,] 单位：kW
        """
        # 归一化
        features_normalized = self._normalize(features)
        
        # 转换为tensor
        x = torch.FloatTensor(features_normalized).unsqueeze(0).to(self.device)
        
        # 预测
        with torch.no_grad():
            prediction = self.model(x)
        
        # 反归一化
        power_prediction = self._denormalize(prediction.cpu().numpy()[0])
        
        # 后处理：功率不能为负，不能超过装机容量
        power_prediction = np.clip(power_prediction, 0, self.max_capacity)
        
        return power_prediction
    
    def evaluate(self, test_data: np.ndarray, test_labels: np.ndarray) -> dict:
        """
        模型评估
        
        指标：
        - RMSE: 均方根误差
        - MAE: 平均绝对误差  
        - MAPE: 平均绝对百分比误差
        - R²: 决定系数
        """
        predictions = []
        for i in range(len(test_data)):
            pred = self.predict(test_data[i])
            predictions.append(pred)
        
        predictions = np.array(predictions)
        
        rmse = np.sqrt(np.mean((predictions - test_labels) ** 2))
        mae = np.mean(np.abs(predictions - test_labels))
        mape = np.mean(np.abs((predictions - test_labels) / test_labels)) * 100
        r2 = 1 - np.sum((test_labels - predictions) ** 2) / np.sum((test_labels - np.mean(test_labels)) ** 2)
        
        return {
            'RMSE': rmse,
            'MAE': mae,
            'MAPE': mape,
            'R²': r2
        }`,
        concepts: [
          {
            term: 'LSTM',
            explanation: 'Long Short-Term Memory，长短期记忆网络，适合处理时序数据的深度学习模型'
          },
          {
            term: '注意力机制（Attention）',
            explanation: '让模型关注输入序列中最重要的部分，提升预测精度'
          },
          {
            term: '特征工程',
            explanation: '从原始数据中提取、转换、构造对模型有用的特征'
          },
          {
            term: 'GHI/DNI',
            explanation: 'Global Horizontal Irradiance（全局水平辐照度）/ Direct Normal Irradiance（直接法向辐照度）'
          }
        ]
      }
    ]
  }
]

const projects = ref<Project[]>(builtInProjects)
const currentProject = ref<Project | null>(null)
const currentFile = ref<ProjectFile | null>(null)
const sidebarCollapsed = ref(false)
const filesCollapsed = ref(false)

function selectProject(project: Project) {
  currentProject.value = project
  currentFile.value = null
}

function selectFile(file: ProjectFile) {
  currentFile.value = file
}

function getFileIcon(type: string): string {
  return type === 'folder' ? '📁' : '📄'
}

function renderMarkdown(content: string): string {
  if (!content) return ''
  
  return content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

function copyCode() {
  if (currentFile.value?.code) {
    navigator.clipboard.writeText(currentFile.value.code)
    alert('代码已复制到剪贴板')
  }
}
</script>

<style scoped>
.github-learning-page {
  display: flex;
  height: calc(100vh - 64px);
  background: var(--bg-primary);
}

/* 侧边栏通用样式 */
.projects-sidebar,
.files-sidebar {
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.projects-sidebar {
  width: 260px;
}

.projects-sidebar.collapsed {
  width: 50px;
}

.files-sidebar {
  width: 280px;
}

.files-sidebar.collapsed {
  width: 50px;
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
}

.collapse-btn:hover {
  background: var(--accent-primary-bg);
  color: var(--accent-primary);
}

/* 项目列表 */
.project-list,
.file-tree {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.project-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.project-item:hover,
.project-item.active {
  background: var(--accent-primary-bg);
}

.project-item.active .project-name {
  color: var(--accent-primary);
  font-weight: var(--font-weight-medium);
}

.project-icon {
  font-size: 24px;
}

.project-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.project-name {
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.project-category {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

/* 文件列表 */
.file-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.file-item:hover,
.file-item.active {
  background: var(--accent-primary-bg);
}

.file-item.active .file-name {
  color: var(--accent-primary);
}

.file-icon {
  font-size: 16px;
}

.file-name {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  font-family: 'Fira Code', monospace;
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
  font-family: 'Fira Code', monospace;
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

/* 内容区块 */
.file-description,
.analysis-section,
.code-section,
.concepts-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-card);
}

.file-description h3,
.analysis-section h3,
.code-section h3,
.concepts-section h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-light);
}

.description-content,
.analysis-content {
  line-height: 1.8;
  color: var(--text-primary);
}

.description-content h1,
.analysis-content h1 {
  font-size: var(--font-size-xl);
  margin-bottom: var(--space-3);
}

.description-content h2,
.analysis-content h2 {
  font-size: var(--font-size-lg);
  margin-top: var(--space-4);
  margin-bottom: var(--space-2);
  color: var(--accent-primary);
}

.description-content h3,
.analysis-content h3 {
  font-size: var(--font-size-md);
  margin-top: var(--space-3);
  margin-bottom: var(--space-2);
  border-bottom: none;
  padding-bottom: 0;
}

.description-content pre,
.analysis-content pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: var(--space-3) 0;
}

.description-content code,
.analysis-content code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

/* 代码区域 */
.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.code-lang {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.copy-btn {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--accent-primary);
  background: var(--accent-primary-bg);
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
}

.copy-btn:hover {
  background: var(--accent-primary);
  color: var(--text-inverse);
}

.code-block {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  overflow-x: auto;
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
  margin: 0;
}

/* 概念卡片 */
.concepts-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-4);
}

.concept-card {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  border-left: 4px solid var(--accent-primary);
}

.concept-term {
  font-weight: var(--font-weight-bold);
  color: var(--accent-primary);
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
}

.concept-explanation {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.6;
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

/* 按钮 */
.btn-secondary {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.btn-secondary:hover {
  background: var(--bg-hover);
}

@media (max-width: 1024px) {
  .projects-sidebar {
    width: 220px;
  }
  
  .files-sidebar {
    width: 240px;
  }
}

@media (max-width: 768px) {
  .github-learning-page {
    flex-direction: column;
    height: auto;
  }
  
  .projects-sidebar,
  .files-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border);
    max-height: 200px;
  }
  
  .concepts-list {
    grid-template-columns: 1fr;
  }
}
</style>
