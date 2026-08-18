import { useState, useRef, useEffect } from 'react'
import { sendChatMessage } from '../../services/api/apiClient'

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setMessages([])
    }
  }

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return

    const newMessages = [...messages, { text: inputValue, sender: 'user' }]
    setMessages(newMessages)
    setInputValue('')
    setIsTyping(true)

    const res = await sendChatMessage(inputValue)

    setIsTyping(false)

    if (res.ok) {
      setMessages([...newMessages, { text: res.data.reply, sender: 'bot' }])
    } else {
      setMessages([...newMessages, { text: "I'm sorry, I'm having trouble connecting. Please try again later.", sender: 'bot' }])
    }
  }

  return (
    <>
      <button
        onClick={toggleChat}
        className="fixed bottom-5 right-5 bg-primary-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-primary-700 transition-colors z-50"
        aria-label="Toggle chat assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-5 w-[350px] h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
          <div className="bg-primary-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-bold text-lg">Chat Assistant</h3>
            <button onClick={toggleChat} className="text-white hover:text-gray-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start mb-3">
                <div className="bg-gray-200 text-gray-800 p-3 rounded-lg flex items-center">
                  <span className="animate-pulse h-2 w-2 bg-gray-500 rounded-full mr-1"></span>
                  <span className="animate-pulse h-2 w-2 bg-gray-500 rounded-full mr-1 delay-150"></span>
                  <span className="animate-pulse h-2 w-2 bg-gray-500 rounded-full delay-300"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-primary-600 text-white px-4 py-2 rounded-r-lg hover:bg-primary-700 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatAssistant
