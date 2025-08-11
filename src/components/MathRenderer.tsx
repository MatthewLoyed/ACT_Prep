import { useEffect, useRef } from 'react'

interface MathRendererProps {
  content: string
  className?: string
}

export default function MathRenderer({ content, className = '' }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current || !content) return

    // Initialize MathJax if not already done
    if (typeof window !== 'undefined' && !(window as any).MathJax) {
      const script = document.createElement('script')
      script.src = 'https://polyfill.io/v3/polyfill.min.js?features=es6'
      document.head.appendChild(script)

      script.onload = () => {
        const mathJaxScript = document.createElement('script')
        mathJaxScript.id = 'MathJax-script'
        mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js'
        mathJaxScript.async = true
        document.head.appendChild(mathJaxScript)
      }
    }

    // Process math expressions in the content
    const processMath = () => {
      if (!containerRef.current) return

      // Replace common math symbols with LaTeX
      let processedContent = content
        .replace(/△/g, '\\triangle ') // triangle
        .replace(/²/g, '^2') // superscript 2
        .replace(/³/g, '^3') // superscript 3
        .replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}') // fractions
        .replace(/√/g, '\\sqrt') // square root
        .replace(/π/g, '\\pi ') // pi
        .replace(/∞/g, '\\infty ') // infinity
        .replace(/±/g, '\\pm ') // plus-minus
        .replace(/≤/g, '\\leq ') // less than or equal
        .replace(/≥/g, '\\geq ') // greater than or equal
        .replace(/≠/g, '\\neq ') // not equal
        .replace(/∠/g, '\\angle ') // angle
        .replace(/°/g, '^{\\circ}') // degrees

      // Handle matrices (simple 2x2 format)
      processedContent = processedContent.replace(
        /\[([^\[\]]+)\]/g,
        (_, content) => {
          const rows = content.split(';').map((row: string) => 
            row.trim().split(',').map((cell: string) => cell.trim()).join(' & ')
          ).join(' \\\\ ')
          return `\\begin{pmatrix} ${rows} \\end{pmatrix}`
        }
      )

      // Wrap math expressions in LaTeX delimiters
      processedContent = processedContent.replace(
        /(\\(?:frac|sqrt|pi|infty|pm|leq|geq|neq|angle|triangle)\{[^}]*\})/g,
        '$$1$$'
      )

      containerRef.current.innerHTML = processedContent

      // Render with MathJax
      if ((window as any).MathJax) {
        (window as any).MathJax.typesetPromise([containerRef.current]).catch((err: any) => {
          console.warn('MathJax rendering error:', err)
        })
      }
    }

    // Wait for MathJax to load
    const checkMathJax = () => {
      if ((window as any).MathJax) {
        processMath()
      } else {
        setTimeout(checkMathJax, 100)
      }
    }

    checkMathJax()
  }, [content])

  return <div ref={containerRef} className={className} />
}

