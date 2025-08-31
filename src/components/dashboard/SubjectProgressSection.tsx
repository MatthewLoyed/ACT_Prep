import { motion } from 'framer-motion'

type SubjectProgress = {
  name: string
  actScore: number
  questionsPracticed: number
  timeSpent: number
  tip: string
}

interface SubjectProgressSectionProps {
  subjects: SubjectProgress[]
}

export default function SubjectProgressSection({ subjects }: SubjectProgressSectionProps) {
  return (
    <motion.div 
      className="grid gap-4 md:grid-cols-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.9 }}
    >
      {subjects.map((subject, index) => (
        <motion.div 
          key={subject.name}
          className="card p-5"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0 + (index * 0.1) }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold capitalize">{subject.name}</h3>
            <div className="rounded-xl px-3 py-1 bg-slate-100 dark:bg-slate-800">
              {subject.actScore} / 36
            </div>
          </div>
          <p className="mt-2 text-sm text-secondary">{subject.tip}</p>
          <div className="mt-3 text-sm text-secondary">
            Practiced: {subject.questionsPracticed} questions • {Math.round(subject.timeSpent / 60)} min
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
