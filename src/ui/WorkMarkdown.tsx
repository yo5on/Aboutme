import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Split out so the markdown parser only loads when a project is first opened
export default function WorkMarkdown({ children }: { children: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
}
