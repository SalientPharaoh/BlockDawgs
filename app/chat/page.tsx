"use client"

import React, { useState, useEffect } from 'react'
import { PanelLeftClose, PanelLeft, ArrowLeft } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { threadStorage } from '@/lib/threadStorage'
import AnimatedBackground from '../components/chat/AnimatedBackground'
import ProfileDropdown from '../components/chat/ProfileDropdown'
import Sidebar from '../components/chat/Sidebar'
import ChatArea from '../components/chat/ChatArea'

interface Chat {
  id: number
  threadId: string
  title: string
  messages: Message[]
}

interface Message {
  content: string
  role: 'user' | 'assistant'
  timestamp: string
  isStreaming?: boolean
  fullContent?: string
}

export default function MainPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false)
  const [chats, setChats] = useState<Chat[]>([])
  const [currentChat, setCurrentChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGlobalView, setIsGlobalView] = useState(false)

  const fetchMessagesFromDB = async () => {
    try {
      setIsLoading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      let requestBody = {}
      const threadId = currentChat?.threadId
      
      if (threadId) {
        requestBody = {
          thread_ids: [threadId],
          is_global: false
        }
      } else {
        if (isGlobalView) {
          requestBody = {
            is_global: true
          }
        } else {
          const storedThreadIds = threadStorage.getThreadIds()
          if (storedThreadIds.length === 0) {
            setChats([])
            setIsLoading(false)
            return
          }
          requestBody = {
            thread_ids: storedThreadIds,
            is_global: false
          }
        }
      }

      const response = await fetch(`${apiUrl}/get_messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const posts = data.messages
  
      const seenMessages = new Set()
      const uniqueChats: Chat[] = []
  
      posts.forEach((post: any) => {
        if (post?.query?.model?.messages) {
          const dbMessages = post.query.model.messages
          const threadId = post.thread_id

          const chatHash = JSON.stringify(dbMessages.map((msg: any) => ({
            content: msg.kwargs.content.trim(),
            type: msg.kwargs.type
          })))
  
          if (!seenMessages.has(chatHash)) {
            seenMessages.add(chatHash)
            const newChat = convertDBMessagesToChat(dbMessages, uniqueChats.length, threadId)
            uniqueChats.push(newChat)
          }
        }
      })
  
      setChats(uniqueChats)
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteFromDB = async (threadId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      
      const response = await fetch(`${apiUrl}/messages`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ thread_id: threadId })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      threadStorage.removeThreadId(threadId)
      await fetchMessagesFromDB()
    } catch (error) {
      console.error('Error deleting from database:', error)
      throw error
    }
  }

  useEffect(() => {
    fetchMessagesFromDB()
  }, [])

  const handleSendMessage = async (message: string, chatToUse?: Chat) => {
    const wordCount = message.trim().split(/\s+/).length
    if (wordCount > 100) {
      alert('Please keep your message under 100 words for better responses.')
      return
    }

    if (isLoading) return
    
    try {
      localStorage.setItem('lastMessageTime', Date.now().toString())
      
      const activeChat = chatToUse || currentChat || {
        id: Date.now(),
        threadId: uuidv4(),
        title: message,
        messages: [],
      }
      const userMessage: Message = {
        content: message.trim(),
        role: 'user',
        timestamp: new Date().toISOString()
      }
  
      const updatedChat: Chat = {
        ...activeChat,
        title: activeChat.messages.length === 0 ? message : activeChat.title,
        messages: [...(activeChat.messages || []), userMessage]
      }

      const initialAssistantMessage: Message = {
        content: "",
        role: 'assistant',
        timestamp: new Date().toISOString(),
        isStreaming: true
      }

      const chatWithAssistant = {
        ...updatedChat,
        messages: [...updatedChat.messages, initialAssistantMessage]
      }

      setChats(prevChats => {
        const chatExists = prevChats.some(c => c.id === chatWithAssistant.id)
        const filteredChats = chatExists 
          ? prevChats.filter(c => c.id !== chatWithAssistant.id) 
          : prevChats
        return [chatWithAssistant, ...filteredChats]
      })
      setCurrentChat(chatWithAssistant)
  
      try {
        const timeoutPromise = new Promise<Response>((_, reject) => {
          setTimeout(() => {
            reject(new Error('TIMEOUT'))
          }, 35000)
        })
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const fetchPromise = fetch(`${apiUrl}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            query: message.trim(),
            id: activeChat.id,
            threadId: activeChat.threadId
          }),
        })

        const response = await Promise.race<Response>([fetchPromise, timeoutPromise])

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const fullResponse = data.response || 'No response from assistant'
  
        let streamedContent = ''
        const words = fullResponse.split(' ')
        
        for (let i = 0; i < words.length; i++) {
          streamedContent += (i === 0 ? '' : ' ') + words[i]
          
          const updatedAssistantMessage: Message = {
            content: streamedContent,
            role: 'assistant',
            timestamp: new Date().toISOString(),
            isStreaming: i < words.length - 1
          }
  
          const updatedChatWithStream: Chat = {
            ...chatWithAssistant,
            messages: [
              ...chatWithAssistant.messages.slice(0, -1),
              updatedAssistantMessage
            ]
          }
  
          setCurrentChat(updatedChatWithStream)
          setChats(prevChats => {
            const filteredChats = prevChats.filter(c => c.id !== updatedChatWithStream.id)
            return [updatedChatWithStream, ...filteredChats]
          })
          await new Promise(resolve => setTimeout(resolve, 30))
        }
  
        const finalChat: Chat = {
          ...chatWithAssistant,
          messages: [
            ...chatWithAssistant.messages.slice(0, -1),
            {
              content: fullResponse,
              role: 'assistant',
              timestamp: new Date().toISOString()
            } as Message
          ]
        }
        
        setChats(prevChats => {
          const filteredChats = prevChats.filter(c => c.id !== finalChat.id)
          return [finalChat, ...filteredChats]
        })
  
      } catch (error: any) {
        console.error('Error in chat request:', error)
        
        const errorResponse: Message = {
          content: error.message === 'TIMEOUT' 
            ? "I apologize for the delay. I'm taking longer than usual to process your request. Please try again or rephrase your question."
            : "Sorry, there was an error processing your request. Please try again.",
          role: 'assistant',
          timestamp: new Date().toISOString(),
          isStreaming: false
        }
        
        const chatWithError = {
          ...chatWithAssistant,
          messages: [...chatWithAssistant.messages.slice(0, -1), errorResponse]
        }
        setCurrentChat(chatWithError)
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteChat = async (chatId: number) => {
    try {
      const chatToDelete = chats.find(chat => chat.id === chatId)
      
      if (chatToDelete?.threadId) {
        await deleteFromDB(chatToDelete.threadId)
        setChats(prevChats => prevChats.filter(chat => chat.id !== chatId))
        
        if (currentChat?.id === chatId) {
          setCurrentChat(null)
        }
      } else {
        console.error('No thread ID found for chat to delete')
      }
    } catch (error) {
      console.error('Error deleting chat:', error)
      alert('Failed to delete chat. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const createNewChat = async (initialMessage?: string) => {
    const existingEmptyChat = chats.find(chat => 
      chat.messages.length === 0 && chat.title === 'New Chat'
    )

    if (existingEmptyChat && !initialMessage) {
      setCurrentChat(existingEmptyChat)
      return
    }

    const threadId = uuidv4()
    const newChat: Chat = {
      id: Date.now(),
      threadId,
      title: initialMessage || 'New Chat',
      messages: [],
    }

    setCurrentChat(newChat)
    setChats(prevChats => [newChat, ...prevChats])
    threadStorage.addThreadId(threadId)

    if (initialMessage) {
      await handleSendMessage(initialMessage, newChat)
    }
  }

  return (
    <div className="relative min-h-screen bg-transparent">
      {!currentChat?.messages?.length && <AnimatedBackground />}
      <div className="relative z-10 h-screen flex text-gray-100 overflow-hidden bg-transparent">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`fixed top-4 left-4 z-50 p-2 rounded-lg transition-all duration-300 ease-in-out
            ${isSidebarOpen 
              ? 'bg-[#0a0b0f] hover:bg-[#3A3A3A]' 
              : 'bg-[#12141c] hover:bg-[#282c3a]'
            }`}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isSidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeft size={24} />}
        </button>

        {isSidebarOpen && (
          <div
            className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out z-20 
              ${isSidebarOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <div
          className={`fixed left-0 top-0 h-full w-[280px] z-30 transition-all duration-300 ease-in-out transform 
            ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
        >
          <div className="h-full flex flex-col">
            <div className="flex-1">
              {isSidebarOpen && (
                <Sidebar
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                  chats={chats}
                  currentChat={currentChat}
                  onChatSelect={setCurrentChat}
                  isGlobalView={isGlobalView}
                  setIsGlobalView={setIsGlobalView}
                  onNewChat={createNewChat}
                  onDeleteChat={handleDeleteChat}
                  onToggleGlobalView={() => setIsGlobalView(!isGlobalView)}
                  isLoading={isLoading}
                  setIsSidebarOpen={setIsSidebarOpen}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 relative w-full max-w-full">
          <div className="relative min-h-screen">
            <div className="absolute top-4 right-4 z-40">
              <ProfileDropdown />
            </div>
            {isGlobalView && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-[#6c5dd3] rounded-full text-xs text-white opacity-50">
                Global View
              </div>
            )}
            {currentChat && (
              <button
                onClick={() => {
                  setCurrentChat(null)
                  createNewChat()
                }}
                className="absolute top-4 left-20 z-40 p-2 rounded-lg bg-[#12141c] hover:bg-[#282c3a] transition-colors"
                aria-label="Back to new chat"
              >
                <ArrowLeft className="h-5 w-5 text-gray-400" />
              </button>
            )}
            <ChatArea
              currentChat={currentChat}
              onSendMessage={handleSendMessage}
              createNewChat={createNewChat}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function convertDBMessagesToChat(messages: any[], index: number, threadId: string): Chat {
  return {
    id: Date.now() + index,
    threadId,
    title: messages[0]?.kwargs?.content || 'New Chat',
    messages: messages.map(msg => ({
      content: msg.kwargs.content,
      role: msg.kwargs.type as 'user' | 'assistant',
      timestamp: new Date().toISOString()
    }))
  }
}