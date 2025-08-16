import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Lightbulb,
  Plus,
  Trash,
  ArrowUpRight,
  BookOpen,
  Star,
  PencilSimple,
  PushPin
} from '@phosphor-icons/react'

type UserTip = {
  id: string
  text: string
  createdAt: string
  isPinned?: boolean
}

export default function Tips() {
  const [userTips, setUserTips] = useState<UserTip[]>([])
  const [newTip, setNewTip] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTipId, setEditingTipId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  // Load user tips from localStorage on component mount
  useEffect(() => {
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      setTipsLoaded(true) // Mark as loaded even if failed
      return
    }
    
    try {
      const savedTips = localStorage.getItem('userTips')
      
      if (savedTips) {
        const parsedTips = JSON.parse(savedTips)
        setUserTips(parsedTips)
      }
    } catch (error) {
      console.error('❌ Error accessing localStorage:', error)
    }
    
    // Mark tips as loaded (whether we found any or not)
    setTipsLoaded(true)
  }, [])

  // Track if tips have been loaded from localStorage
  const [tipsLoaded, setTipsLoaded] = useState(false)

  // Save user tips to localStorage when they change
  useEffect(() => {
    // Don't save until tips have been loaded from localStorage
    if (!tipsLoaded) {
      return
    }
    
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      return
    }
    
    try {
      localStorage.setItem('userTips', JSON.stringify(userTips))
    } catch (error) {
      console.error('❌ Error saving tips to localStorage:', error)
    }
  }, [userTips, tipsLoaded])

  const addTip = () => {
    if (newTip.trim()) {
      const tip: UserTip = {
        id: Date.now().toString(),
        text: newTip.trim(),
        createdAt: new Date().toISOString()
      }
      
      setUserTips(prev => [tip, ...prev])
      setNewTip('')
      setShowAddForm(false)
    }
  }

  const deleteTip = (id: string) => {
    setUserTips(prev => prev.filter(tip => tip.id !== id))
  }

  const editTip = (id: string) => {
    const tip = userTips.find(t => t.id === id)
    if (tip) {
      setEditingTipId(id)
      setEditingText(tip.text)
    }
  }

  const saveEdit = () => {
    if (editingTipId && editingText.trim()) {
      setUserTips(prev => prev.map(tip => 
        tip.id === editingTipId 
          ? { ...tip, text: editingText.trim() }
          : tip
      ))
      setEditingTipId(null)
      setEditingText('')
    }
  }

  const cancelEdit = () => {
    setEditingTipId(null)
    setEditingText('')
  }

  const togglePin = (id: string) => {
    setUserTips(prev => prev.map(tip => 
      tip.id === id 
        ? { ...tip, isPinned: !tip.isPinned }
        : tip
    ))
  }

  const handlePinWithAnimation = (id: string) => {
    const tip = userTips.find(t => t.id === id)
    if (tip) {
      // Simple toggle without complex animations
      togglePin(id)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4 text-shadow-lg">
          ACT® Study Tips & Resources
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          Official resources and your personal study tips to help you succeed
        </p>
      </div>

      <div className="space-y-8">
        {/* Official ACT Resources */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="w-8 h-8 text-[#ffeaa7]" weight="fill" />
            <h2 className="text-2xl font-bold text-white">Official ACT® Resources</h2>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-4">
              <div className="text-3xl">📋</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">Free ACT® Practice Resources Guide</h3>
                <p className="text-secondary mb-4">
                  Comprehensive guide with practice tests, study materials, video resources, and test-taking strategies from ACT®
                </p>
                <div className="space-y-2 text-sm text-secondary">
                  <p>• Full-length online practice tests</p>
                  <p>• Video prep classes for all sections</p>
                  <p>• Test-taking strategies and tips</p>
                  <p>• Student advice and anxiety management</p>
                </div>
                <a 
                  href="https://site.act.org/hubfs/Counselor%20Outreach%20Team%20Files/Free%20ACT%20Practice%20Resources%20Guide%20Final.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Download Official Guide →
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* User Tips Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Lightbulb className="w-8 h-8 text-[#ffeaa7]" weight="fill" />
              <h2 className="text-2xl font-bold text-white">Your Study Tips</h2>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#ffeaa7] to-[#fdcb6e] text-gray-800 font-bold py-2 px-4 rounded-xl hover:scale-105 transition-transform"
            >
              <Plus className="w-5 h-5" />
              Add Tip
            </button>
          </div>

          {/* Add Tip Form */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20"
            >
              <textarea
                value={newTip}
                onChange={(e) => setNewTip(e.target.value)}
                placeholder="Enter your study tip, strategy, or reminder..."
                className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 resize-none"
                rows={3}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    addTip()
                  }
                }}
              />
              <div className="flex gap-3 mt-3">
                <button
                  onClick={addTip}
                  disabled={!newTip.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#ffeaa7] to-[#fdcb6e] text-gray-800 font-bold py-2 px-4 rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Save Tip
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setNewTip('')
                  }}
                  className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
              <p className="text-xs text-white/60 mt-2">
                💡 Tip: Press Ctrl+Enter to quickly save your tip
              </p>
            </motion.div>
          )}

          {/* User Tips List */}
          {userTips.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">💭</div>
              <h3 className="text-xl font-semibold mb-2">No tips yet</h3>
              <p className="text-secondary mb-4">
                Add your own study tips, strategies, or reminders to help you remember important concepts
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-[#ffeaa7] to-[#fdcb6e] text-gray-800 font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform mx-auto"
              >
                <Plus className="w-5 h-5" />
                Add Your First Tip
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {userTips
                .sort((a, b) => {
                  // Sort pinned tips first, then by creation date (newest first)
                  if (a.isPinned && !b.isPinned) return -1
                  if (!a.isPinned && b.isPinned) return 1
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                })
                .map((tip) => (
                                                  <motion.div
                   key={tip.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ 
                     opacity: 1, 
                     y: tip.isPinned ? -10 : 0,
                     scale: tip.isPinned ? 1.02 : 1
                   }}
                   transition={{ 
                     duration: 0.3,
                     type: "spring",
                     stiffness: 200,
                     damping: 15
                   }}
                   className={`bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 group hover:bg-white/15 transition-all duration-200 ${
                     tip.isPinned ? 'ring-2 ring-[#ffeaa7] ring-opacity-50 shadow-lg' : ''
                   }`}
                 >
                  {editingTipId === tip.id ? (
                    // Edit mode
                    <div className="space-y-3">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 resize-none"
                        rows={3}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.ctrlKey) {
                            saveEdit()
                          }
                          if (e.key === 'Escape') {
                            cancelEdit()
                          }
                        }}
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={saveEdit}
                          disabled={!editingText.trim()}
                          className="flex items-center gap-2 bg-gradient-to-r from-[#ffeaa7] to-[#fdcb6e] text-gray-800 font-bold py-2 px-4 rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 text-white/80 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-xs text-white/60">
                        💡 Tip: Press Ctrl+Enter to save or Escape to cancel
                      </p>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-2">
                          {tip.isPinned && (
                            <PushPin className="w-4 h-4 text-[#ffeaa7] mt-1 flex-shrink-0" weight="fill" />
                          )}
                          <p className="text-white text-lg leading-relaxed">{tip.text}</p>
                        </div>
                        <p className="text-white/60 text-sm mt-2">
                          Added {formatDate(tip.createdAt)}
                        </p>
                      </div>
                                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                         <motion.button
                           onClick={() => editTip(tip.id)}
                           className="p-2 text-[#ffeaa7] hover:text-[#fdcb6e] hover:bg-[#ffeaa7]/20 rounded-lg transition-colors"
                           title="Edit tip"
                           whileHover={{ scale: 1.1 }}
                           whileTap={{ scale: 0.95 }}
                         >
                           <PencilSimple className="w-5 h-5" />
                         </motion.button>
                         <motion.button
                           onClick={() => handlePinWithAnimation(tip.id)}
                           className={`p-2 rounded-lg transition-colors ${
                             tip.isPinned 
                               ? 'text-[#ffeaa7] hover:text-[#fdcb6e] hover:bg-[#ffeaa7]/20' 
                               : 'text-white/60 hover:text-[#ffeaa7] hover:bg-[#ffeaa7]/20'
                           }`}
                           title={tip.isPinned ? 'Unpin tip' : 'Pin tip'}
                           whileHover={{ scale: 1.1 }}
                           whileTap={{ scale: 0.95 }}
                           animate={tip.isPinned ? { 
                             scale: [1, 1.2, 1],
                             rotate: [0, 5, -5, 0]
                           } : {}}
                           transition={{ duration: 0.3 }}
                         >
                           <motion.div
                             animate={tip.isPinned ? { rotate: 0 } : { rotate: -45 }}
                             transition={{ duration: 0.2 }}
                           >
                             <PushPin className="w-5 h-5" weight={tip.isPinned ? 'fill' : 'regular'} />
                           </motion.div>
                         </motion.button>
                         <motion.button
                           onClick={() => deleteTip(tip.id)}
                           className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                           title="Delete tip"
                           whileHover={{ scale: 1.1 }}
                           whileTap={{ scale: 0.95 }}
                         >
                           <Trash className="w-5 h-5" />
                         </motion.button>
                       </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-8 h-8 text-[#ffeaa7]" weight="fill" />
            <h2 className="text-2xl font-bold text-white">Quick Study Tips</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
              <h4 className="font-semibold text-lg mb-2">Time Management</h4>
              <p className="text-secondary text-sm">
                Practice with a timer to get comfortable with the pace. English: ~42 seconds per question, Math: ~67 seconds per question.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-lg mb-2">Reading Strategy</h4>
              <p className="text-secondary text-sm">
                Read the questions first, then scan the passage for key information. This helps you focus on what's important.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-lg mb-2">Math Approach</h4>
              <p className="text-secondary text-sm">
                Use the calculator strategically. Some problems are faster to solve mentally, while others benefit from calculator use.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800">
              <h4 className="font-semibold text-lg mb-2">Science Section</h4>
              <p className="text-secondary text-sm">
                Focus on data interpretation rather than memorization. Look for trends, patterns, and relationships in the data.
              </p>
            </div>
          </div>
        </motion.div>

        {/* YouTube Video Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="card p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="text-3xl">📺</div>
            <h2 className="text-2xl font-bold text-white">ACT® Study Video</h2>
          </div>
          
          <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-4">
              <div className="text-2xl">🎥</div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">ACT® Test Prep: Complete Guide</h3>
                <p className="text-secondary mb-4">
                  Watch this comprehensive guide to understand the ACT® test structure, timing strategies, and proven study techniques to boost your score.
                </p>
                
                                 {/* YouTube Video Embed */}
                 <div className="relative w-full pb-[56.25%] h-0 overflow-hidden rounded-2xl shadow-lg bg-gray-900">
                   <iframe
                     className="absolute top-0 left-0 w-full h-full"
                     src="https://www.youtube.com/embed/uTYdu1O53uw?rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&cc_load_policy=0&disablekb=1"
                     title="YouTube video player"
                     frameBorder="0"
                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                     allowFullScreen
                   ></iframe>
                 </div>
                
                <div className="mt-4 text-sm text-secondary">
                  <p>💡 <strong>Key Takeaways:</strong></p>
                  <ul className="mt-2 space-y-1 ml-4">
                    <li>• Understanding the ACT® test format and timing</li>
                    <li>• Effective study strategies for each section</li>
                    <li>• Time management techniques</li>
                    <li>• Common mistakes to avoid</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

