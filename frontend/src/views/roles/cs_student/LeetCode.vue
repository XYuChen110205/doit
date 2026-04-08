<template>
  <div class="leetcode-page">
    <!-- 左侧：题目列表 -->
    <div class="problems-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <h3 v-show="!sidebarCollapsed">题目列表</h3>
        <div class="header-actions">
          <button class="add-btn" @click="showAddProblem = true" v-show="!sidebarCollapsed">+</button>
          <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
            {{ sidebarCollapsed ? '→' : '←' }}
          </button>
        </div>
      </div>
      
      <!-- 筛选器 -->
      <div class="filter-section" v-show="!sidebarCollapsed">
        <div class="filter-group">
          <label>难度</label>
          <select v-model="filterDifficulty">
            <option value="">全部</option>
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>
        <div class="filter-group">
          <label>状态</label>
          <select v-model="filterStatus">
            <option value="">全部</option>
            <option value="solved">已解决</option>
            <option value="attempted">尝试过</option>
            <option value="unsolved">未解决</option>
          </select>
        </div>
      </div>

      <div class="problem-list">
        <div
          v-for="problem in filteredProblems"
          :key="problem.id"
          class="problem-item"
          :class="{ 
            active: currentProblem?.id === problem.id,
            solved: problem.status === 'solved',
            attempted: problem.status === 'attempted'
          }"
          @click="selectProblem(problem)"
        >
          <span class="problem-status">{{ getStatusIcon(problem.status) }}</span>
          <div class="problem-info">
            <span class="problem-id">{{ problem.id }}</span>
            <span class="problem-title">{{ problem.title }}</span>
          </div>
          <span class="problem-difficulty" :class="problem.difficulty">
            {{ getDifficultyText(problem.difficulty) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 右侧：题目详情 -->
    <div class="problem-detail" v-if="currentProblem">
      <div class="detail-header">
        <div class="header-title">
          <h2>{{ currentProblem.id }}. {{ currentProblem.title }}</h2>
          <div class="problem-tags">
            <span class="tag difficulty" :class="currentProblem.difficulty">
              {{ getDifficultyText(currentProblem.difficulty) }}
            </span>
            <span v-for="tag in currentProblem.tags" :key="tag" class="tag">
              {{ tag }}
            </span>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn-secondary" @click="showEditProblem = true">编辑</button>
          <button 
            class="btn-primary" 
            :class="{ solved: currentProblem.status === 'solved' }"
            @click="markAsSolved"
          >
            {{ currentProblem.status === 'solved' ? '已解决' : '标记为解决' }}
          </button>
        </div>
      </div>

      <div class="detail-body">
        <!-- 题目描述 -->
        <div class="description-section">
          <h3>题目描述</h3>
          <div class="description-content" v-html="renderMarkdown(currentProblem.description)"></div>
        </div>

        <!-- 示例 -->
        <div class="examples-section" v-if="currentProblem.examples?.length">
          <h3>示例</h3>
          <div v-for="(example, index) in currentProblem.examples" :key="index" class="example-card">
            <div class="example-title">示例 {{ index + 1 }}：</div>
            <div class="example-content">
              <div class="example-line">
                <span class="label">输入：</span>
                <code>{{ example.input }}</code>
              </div>
              <div class="example-line">
                <span class="label">输出：</span>
                <code>{{ example.output }}</code>
              </div>
              <div class="example-line" v-if="example.explanation">
                <span class="label">解释：</span>
                <span>{{ example.explanation }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 解题思路 -->
        <div class="solution-section">
          <h3>💡 解题思路</h3>
          <div class="solution-content" v-html="renderMarkdown(currentProblem.solution)"></div>
        </div>

        <!-- 代码实现 -->
        <div class="code-section">
          <h3>💻 代码实现</h3>
          <div class="code-tabs">
            <button 
              v-for="lang in ['python', 'java', 'cpp']" 
              :key="lang"
              class="tab-btn"
              :class="{ active: currentLang === lang }"
              @click="currentLang = lang"
            >
              {{ lang.toUpperCase() }}
            </button>
          </div>
          <pre class="code-block"><code>{{ currentProblem.code[currentLang] }}</code></pre>
        </div>

        <!-- 复杂度分析 -->
        <div class="complexity-section">
          <h3>📊 复杂度分析</h3>
          <div class="complexity-grid">
            <div class="complexity-item">
              <span class="label">时间复杂度：</span>
              <span class="value">{{ currentProblem.timeComplexity }}</span>
            </div>
            <div class="complexity-item">
              <span class="label">空间复杂度：</span>
              <span class="value">{{ currentProblem.spaceComplexity }}</span>
            </div>
          </div>
        </div>

        <!-- 个人笔记 -->
        <div class="notes-section">
          <h3>📝 我的笔记</h3>
          <textarea
            v-model="currentProblem.personalNotes"
            class="notes-editor"
            placeholder="记录你的解题思路、易错点、优化想法..."
            @blur="saveProblem"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div class="empty-state" v-else>
      <div class="empty-icon">🎯</div>
      <h3>选择一道题目开始刷题</h3>
      <p>内置了经典算法题目，支持添加自定义题目</p>
    </div>

    <!-- 添加题目弹窗 -->
    <div v-if="showAddProblem" class="modal-overlay" @click.self="showAddProblem = false">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>添加新题目</h3>
          <button class="close-btn" @click="showAddProblem = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>题号</label>
              <input v-model.number="newProblem.id" type="number" placeholder="如：1" />
            </div>
            <div class="form-group">
              <label>难度</label>
              <select v-model="newProblem.difficulty">
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>标题</label>
            <input v-model="newProblem.title" type="text" placeholder="题目名称" />
          </div>
          <div class="form-group">
            <label>标签（用逗号分隔）</label>
            <input v-model="newProblem.tagsText" type="text" placeholder="数组, 哈希表, 双指针" />
          </div>
          <div class="form-group">
            <label>题目描述（支持 Markdown）</label>
            <textarea v-model="newProblem.description" rows="5" placeholder="题目描述..."></textarea>
          </div>
          <div class="form-group">
            <label>解题思路</label>
            <textarea v-model="newProblem.solution" rows="4" placeholder="解题思路..."></textarea>
          </div>
          <div class="form-group">
            <label>Python 代码</label>
            <textarea v-model="newProblem.code.python" rows="6" class="code-textarea" placeholder="Python 代码..."></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>时间复杂度</label>
              <input v-model="newProblem.timeComplexity" type="text" placeholder="O(n)" />
            </div>
            <div class="form-group">
              <label>空间复杂度</label>
              <input v-model="newProblem.spaceComplexity" type="text" placeholder="O(n)" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showAddProblem = false">取消</button>
          <button class="btn-primary" @click="addProblem">添加</button>
        </div>
      </div>
    </div>

    <!-- 编辑题目弹窗 -->
    <div v-if="showEditProblem" class="modal-overlay" @click.self="showEditProblem = false">
      <div class="modal-content large">
        <div class="modal-header">
          <h3>编辑题目</h3>
          <button class="close-btn" @click="showEditProblem = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>题号</label>
              <input v-model.number="editProblemData.id" type="number" />
            </div>
            <div class="form-group">
              <label>难度</label>
              <select v-model="editProblemData.difficulty">
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>标题</label>
            <input v-model="editProblemData.title" type="text" />
          </div>
          <div class="form-group">
            <label>题目描述</label>
            <textarea v-model="editProblemData.description" rows="5"></textarea>
          </div>
          <div class="form-group">
            <label>解题思路</label>
            <textarea v-model="editProblemData.solution" rows="4"></textarea>
          </div>
          <div class="form-group">
            <label>Python 代码</label>
            <textarea v-model="editProblemData.code.python" rows="6" class="code-textarea"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-danger" @click="deleteProblem">删除</button>
          <button class="btn-secondary" @click="showEditProblem = false">取消</button>
          <button class="btn-primary" @click="updateProblem">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Example {
  input: string
  output: string
  explanation?: string
}

interface Problem {
  id: number
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  description: string
  examples: Example[]
  solution: string
  code: {
    python: string
    java: string
    cpp: string
  }
  timeComplexity: string
  spaceComplexity: string
  status: 'unsolved' | 'attempted' | 'solved'
  personalNotes: string
}

// 内置题目数据
const builtInProblems: Problem[] = [
  {
    id: 1,
    title: '两数之和',
    difficulty: 'easy',
    tags: ['数组', '哈希表'],
    description: `给定一个整数数组 \`nums\` 和一个整数目标值 \`target\`，请你在该数组中找出 **和为目标值** *target* 的那 **两个** 整数，并返回它们的数组下标。

你可以假设每种输入只会对应一个答案。但是，数组中同一个元素在答案里不能重复出现。

你可以按任意顺序返回答案。`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: '因为 nums[0] + nums[1] == 9 ，返回 [0, 1]'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]'
      }
    ],
    solution: `## 思路

1. **暴力解法**：两层循环遍历，时间复杂度 O(n²)
2. **哈希表**：用哈希表存储已遍历的数字，时间复杂度 O(n)

## 关键点

- 利用哈希表实现 O(1) 的查找
- 边遍历边存入哈希表，避免重复计算`,
    code: {
      python: `def twoSum(nums: List[int], target: int) -> List[int]:
    hash_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in hash_map:
            return [hash_map[complement], i]
        hash_map[num] = i
    return []`,
      java: `public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> map = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) {
            return new int[] { map.get(complement), i };
        }
        map.put(nums[i], i);
    }
    return new int[] {};
}`,
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> map;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (map.find(complement) != map.end()) {
            return {map[complement], i};
        }
        map[nums[i]] = i;
    }
    return {};
}`
    },
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    status: 'unsolved',
    personalNotes: ''
  },
  {
    id: 2,
    title: '反转链表',
    difficulty: 'easy',
    tags: ['链表', '递归'],
    description: `给你单链表的头节点 \`head\` ，请你反转链表，并返回反转后的链表。`,
    examples: [
      {
        input: 'head = [1,2,3,4,5]',
        output: '[5,4,3,2,1]'
      }
    ],
    solution: `## 思路

### 迭代法
1. 使用三个指针：prev、curr、next
2. 遍历链表，逐个反转指针方向

### 递归法
1. 递归到链表末尾
2. 在回溯时反转指针`,
    code: {
      python: `# 迭代法
def reverseList(head: ListNode) -> ListNode:
    prev = None
    curr = head
    while curr:
        next_temp = curr.next
        curr.next = prev
        prev = curr
        curr = next_temp
    return prev

# 递归法
def reverseListRecursive(head: ListNode) -> ListNode:
    if not head or not head.next:
        return head
    new_head = reverseListRecursive(head.next)
    head.next.next = head
    head.next = None
    return new_head`,
      java: `public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode curr = head;
    while (curr != null) {
        ListNode next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}`,
      cpp: `ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;
    while (curr) {
        ListNode* next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}`
    },
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    status: 'unsolved',
    personalNotes: ''
  },
  {
    id: 3,
    title: '最长无重复子串',
    difficulty: 'medium',
    tags: ['字符串', '滑动窗口', '哈希表'],
    description: `给定一个字符串 \`s\` ，请你找出其中不含有重复字符的 **最长子串** 的长度。`,
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: '因为无重复字符的最长子串是 "abc"，所以其长度为 3'
      },
      {
        input: 's = "bbbbb"',
        output: '1',
        explanation: '因为无重复字符的最长子串是 "b"，所以其长度为 1'
      }
    ],
    solution: `## 滑动窗口法

1. 使用左右指针维护一个窗口
2. 右指针向右移动，扩大窗口
3. 遇到重复字符，左指针向右移动，缩小窗口
4. 用哈希集合记录窗口内的字符

## 关键点

- 滑动窗口思想
- 双指针技巧
- 哈希集合快速判断重复`,
    code: {
      python: `def lengthOfLongestSubstring(s: str) -> int:
    char_set = set()
    left = 0
    max_length = 0
    
    for right in range(len(s)):
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        char_set.add(s[right])
        max_length = max(max_length, right - left + 1)
    
    return max_length`,
      java: `public int lengthOfLongestSubstring(String s) {
    Set<Character> set = new HashSet<>();
    int left = 0, maxLen = 0;
    for (int right = 0; right < s.length(); right++) {
        while (set.contains(s.charAt(right))) {
            set.remove(s.charAt(left));
            left++;
        }
        set.add(s.charAt(right));
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}`,
      cpp: `int lengthOfLongestSubstring(string s) {
    unordered_set<char> charSet;
    int left = 0, maxLen = 0;
    for (int right = 0; right < s.size(); right++) {
        while (charSet.count(s[right])) {
            charSet.erase(s[left]);
            left++;
        }
        charSet.insert(s[right]);
        maxLen = max(maxLen, right - left + 1);
    }
    return maxLen;
}`
    },
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(min(m, n))',
    status: 'unsolved',
    personalNotes: ''
  },
  {
    id: 4,
    title: '二叉树层序遍历',
    difficulty: 'medium',
    tags: ['树', 'BFS', '二叉树'],
    description: `给你二叉树的根节点 \`root\` ，返回其节点值的 **层序遍历** 。 （即逐层地，从左到右访问所有节点）。`,
    examples: [
      {
        input: 'root = [3,9,20,null,null,15,7]',
        output: '[[3],[9,20],[15,7]]'
      }
    ],
    solution: `## BFS 广度优先搜索

1. 使用队列实现
2. 每次处理一层的节点
3. 记录每层的节点值

## 关键点

- 队列的先进先出特性
- 记录每层的节点数量
- 逐层处理`,
    code: {
      python: `def levelOrder(root: TreeNode) -> List[List[int]]:
    if not root:
        return []
    
    result = []
    queue = deque([root])
    
    while queue:
        level_size = len(queue)
        level_nodes = []
        
        for _ in range(level_size):
            node = queue.popleft()
            level_nodes.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        
        result.append(level_nodes)
    
    return result`,
      java: `public List<List<Integer>> levelOrder(TreeNode root) {
    List<List<Integer>> result = new ArrayList<>();
    if (root == null) return result;
    
    Queue<TreeNode> queue = new LinkedList<>();
    queue.offer(root);
    
    while (!queue.isEmpty()) {
        int levelSize = queue.size();
        List<Integer> level = new ArrayList<>();
        
        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            level.add(node.val);
            if (node.left != null) queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        result.add(level);
    }
    return result;
}`,
      cpp: `vector<vector<int>> levelOrder(TreeNode* root) {
    vector<vector<int>> result;
    if (!root) return result;
    
    queue<TreeNode*> q;
    q.push(root);
    
    while (!q.empty()) {
        int levelSize = q.size();
        vector<int> level;
        
        for (int i = 0; i < levelSize; i++) {
            TreeNode* node = q.front();
            q.pop();
            level.push_back(node->val);
            if (node->left) q.push(node->left);
            if (node->right) q.push(node->right);
        }
        result.push_back(level);
    }
    return result;
}`
    },
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    status: 'unsolved',
    personalNotes: ''
  }
]

const problems = ref<Problem[]>([])
const currentProblem = ref<Problem | null>(null)
const currentLang = ref<'python' | 'java' | 'cpp'>('python')
const filterDifficulty = ref('')
const filterStatus = ref('')
const showAddProblem = ref(false)
const showEditProblem = ref(false)
const sidebarCollapsed = ref(false)

const newProblem = ref<Partial<Problem> & { tagsText?: string }>({
  id: undefined,
  title: '',
  difficulty: 'easy',
  tagsText: '',
  description: '',
  solution: '',
  code: { python: '', java: '', cpp: '' },
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(n)'
})

const editProblemData = ref<Partial<Problem>>({})

const filteredProblems = computed(() => {
  return problems.value.filter(p => {
    if (filterDifficulty.value && p.difficulty !== filterDifficulty.value) return false
    if (filterStatus.value && p.status !== filterStatus.value) return false
    return true
  })
})

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    unsolved: '○',
    attempted: '△',
    solved: '✓'
  }
  return icons[status] || '○'
}

function getDifficultyText(difficulty: string): string {
  const texts: Record<string, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }
  return texts[difficulty] || difficulty
}

function selectProblem(problem: Problem) {
  currentProblem.value = problem
  editProblemData.value = { ...problem }
}

function markAsSolved() {
  if (!currentProblem.value) return
  currentProblem.value.status = currentProblem.value.status === 'solved' ? 'unsolved' : 'solved'
  saveProblems()
}

function addProblem() {
  if (!newProblem.value.id || !newProblem.value.title) {
    alert('请填写题号和标题')
    return
  }

  const tags = newProblem.value.tagsText
    ?.split(/[,，]/)
    .map(t => t.trim())
    .filter(t => t) || []

  const problem: Problem = {
    id: newProblem.value.id,
    title: newProblem.value.title,
    difficulty: newProblem.value.difficulty || 'easy',
    tags,
    description: newProblem.value.description || '',
    examples: [],
    solution: newProblem.value.solution || '',
    code: newProblem.value.code || { python: '', java: '', cpp: '' },
    timeComplexity: newProblem.value.timeComplexity || 'O(n)',
    spaceComplexity: newProblem.value.spaceComplexity || 'O(n)',
    status: 'unsolved',
    personalNotes: ''
  }

  problems.value.push(problem)
  problems.value.sort((a, b) => a.id - b.id)
  
  showAddProblem.value = false
  newProblem.value = {
    id: undefined,
    title: '',
    difficulty: 'easy',
    tagsText: '',
    description: '',
    solution: '',
    code: { python: '', java: '', cpp: '' },
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)'
  }
  saveProblems()
}

function updateProblem() {
  if (!currentProblem.value) return
  
  Object.assign(currentProblem.value, editProblemData.value)
  showEditProblem.value = false
  saveProblems()
}

function deleteProblem() {
  if (!currentProblem.value) return
  if (!confirm('确定要删除这道题目吗？')) return
  
  const index = problems.value.findIndex(p => p.id === currentProblem.value?.id)
  if (index > -1) {
    problems.value.splice(index, 1)
    currentProblem.value = null
    showEditProblem.value = false
    saveProblems()
  }
}

function saveProblem() {
  saveProblems()
}

function saveProblems() {
  localStorage.setItem('cs_leetcode_problems', JSON.stringify(problems.value))
}

function loadProblems() {
  const saved = localStorage.getItem('cs_leetcode_problems')
  if (saved) {
    problems.value = JSON.parse(saved)
  } else {
    problems.value = JSON.parse(JSON.stringify(builtInProblems))
  }
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

onMounted(() => {
  loadProblems()
})
</script>

<style scoped>
.leetcode-page {
  display: flex;
  height: calc(100vh - 64px);
  background: var(--bg-primary);
}

/* 侧边栏 */
.problems-sidebar {
  width: 320px;
  background: var(--bg-card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.problems-sidebar.collapsed {
  width: 60px;
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

.header-actions {
  display: flex;
  gap: var(--space-2);
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
  transition: var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--accent-primary-bg);
  color: var(--accent-primary);
}

.add-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--accent-primary);
  color: var(--text-inverse);
  border: none;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 筛选器 */
.filter-section {
  padding: var(--space-3);
  border-bottom: 1px solid var(--border);
  display: flex;
  gap: var(--space-3);
}

.filter-group {
  flex: 1;
}

.filter-group label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
}

.filter-group select {
  width: 100%;
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
}

/* 题目列表 */
.problem-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-2);
}

.problem-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-fast);
}

.problem-item:hover,
.problem-item.active {
  background: var(--accent-primary-bg);
}

.problem-item.solved .problem-title {
  color: var(--success);
}

.problem-item.attempted .problem-title {
  color: var(--warning);
}

.problem-status {
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.problem-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.problem-id {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.problem-title {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
}

.problem-difficulty {
  font-size: var(--font-size-xs);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.problem-difficulty.easy {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.problem-difficulty.medium {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.problem-difficulty.hard {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* 详情区域 */
.problem-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
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
  margin-bottom: var(--space-2);
}

.problem-tags {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.tag {
  font-size: var(--font-size-xs);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.tag.difficulty.easy {
  color: #22c55e;
  background: rgba(34, 197, 94, 0.1);
}

.tag.difficulty.medium {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.tag.difficulty.hard {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.header-actions {
  display: flex;
  gap: var(--space-3);
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-6);
}

/* 内容区块 */
.description-section,
.examples-section,
.solution-section,
.code-section,
.complexity-section,
.notes-section {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  margin-bottom: var(--space-6);
  box-shadow: var(--shadow-card);
}

.description-section h3,
.examples-section h3,
.solution-section h3,
.code-section h3,
.complexity-section h3,
.notes-section h3 {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--border-light);
}

.description-content,
.solution-content {
  line-height: 1.8;
  color: var(--text-primary);
}

.description-content pre,
.solution-content pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: var(--space-4);
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: var(--space-3) 0;
}

.description-content code,
.solution-content code {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
}

/* 示例卡片 */
.example-card {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  margin-bottom: var(--space-3);
}

.example-title {
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.example-line {
  margin: var(--space-2) 0;
  font-size: var(--font-size-sm);
}

.example-line .label {
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
}

.example-line code {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  font-family: 'Fira Code', monospace;
}

/* 代码区域 */
.code-tabs {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.tab-btn {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}

.tab-btn:hover {
  background: var(--bg-hover);
}

.tab-btn.active {
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

/* 复杂度 */
.complexity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.complexity-item {
  font-size: var(--font-size-sm);
}

.complexity-item .label {
  color: var(--text-secondary);
}

.complexity-item .value {
  color: var(--accent-primary);
  font-weight: var(--font-weight-bold);
  margin-left: var(--space-2);
}

/* 笔记 */
.notes-editor {
  width: 100%;
  min-height: 100px;
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

/* 弹窗 */
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
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
.form-group select,
.form-group textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-sm);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  box-sizing: border-box;
}

.form-group textarea {
  resize: vertical;
}

.code-textarea {
  font-family: 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4);
  border-top: 1px solid var(--border);
}

/* 按钮 */
.btn-secondary,
.btn-primary,
.btn-danger {
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

.btn-primary {
  color: var(--text-inverse);
  background: var(--accent-primary);
  border: none;
}

.btn-primary.solved {
  background: var(--success);
}

.btn-danger {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  border: none;
  margin-right: auto;
}

@media (max-width: 1024px) {
  .problems-sidebar {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .leetcode-page {
    flex-direction: column;
    height: auto;
  }
  
  .problems-sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border);
    max-height: 300px;
  }
}
</style>
