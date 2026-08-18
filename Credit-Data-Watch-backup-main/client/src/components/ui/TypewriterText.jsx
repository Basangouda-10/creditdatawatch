import { useState, useEffect } from 'react'

const TypewriterText = ({ text, delay = 100 }) => {
  const [displayText, setDisplayText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    setDisplayText('')
    setIsTyping(true)
    let i = 0
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1))
        i++
      } else {
        setIsTyping(false)
        clearInterval(timer)
      }
    }, delay)
    return () => clearInterval(timer)
  }, [text, delay])

  return (
    <span className="inline-block">
      {displayText}
      {isTyping && (
        <span className="inline-block w-1 h-8 md:h-10 bg-white ml-1 animate-pulse align-middle" />
      )}
    </span>
  )
}

export default TypewriterText
