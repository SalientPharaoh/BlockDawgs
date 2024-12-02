'use client';

import { useState, useRef, useEffect } from 'react';
import { Message, StreamMessage, Chat, QuickAction } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { LogoutButton } from '../components/okato-auth/LogoutButton';
import { executeOktoTransfer } from '../utils/oktoTransfer';

type ChatMap = {
  [key: string]: Chat;
};

interface NetworkData {
  network_name: string;
  address: string;
  success: boolean;
}


export default function ChatPage() {
  const [chats, setChats] = useState<ChatMap>({});
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [chatMode, setChatMode] = useState<'chat' | 'command'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);


  // Quick action templates
  const quickActions: QuickAction[] = [
    {
      title: 'Explain Smart Contracts',
      description: 'Learn about smart contract development and best practices',
      action: () => handleQuickAction('Can you explain how smart contracts work and what are the best practices for developing them?')
    },
    {
      title: 'DeFi Concepts',
      description: 'Understand decentralized finance protocols and mechanisms',
      action: () => handleQuickAction('What are the key concepts in DeFi and how do protocols like lending and AMMs work?')
    },
    {
      title: 'NFT Development',
      description: 'Create and deploy NFT collections on blockchain',
      action: () => handleQuickAction('Guide me through creating and deploying an NFT collection on Ethereum. What are the key considerations?')
    },
    {
      title: 'Web3 Integration',
      description: 'Connect dApps with wallets and blockchain',
      action: () => handleQuickAction('How do I integrate Web3 wallets like MetaMask into my dApp and interact with smart contracts?')
    }
  ];

  useEffect(() => {
    // Load chat history from local storage
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      try {
        const parsedChats = JSON.parse(savedChats);
        setChats(parsedChats);
        // Set the first chat as current if exists
        const firstChat = Object.values(parsedChats)[0];
        if (firstChat) {
          setCurrentChat(firstChat);
        }
      } catch (error) {
        console.error('Error loading chats:', error);
        localStorage.removeItem('chats');
      }
    }
  }, []);

  useEffect(() => {
    // Save chats to localStorage whenever they change
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleNewChat = () => {
    // Find existing empty chat
    const existingEmptyChat = Object.values(chats).find(chat => chat.messages.length === 0);
    
    if (existingEmptyChat) {
      // Use existing empty chat
      setCurrentChat(existingEmptyChat);
    } else {
      // Create new chat only if no empty chat exists
      const newChat: Chat = {
        id: Date.now(),
        threadId: Math.random().toString(36).substring(7),
        title: 'New Chat',
        messages: []
      };
      setChats(prev => ({ ...prev, [newChat.id]: newChat }));
      setCurrentChat(newChat);
    }
    setIsSidebarVisible(false);
  };

  const handleQuickAction = (prompt: string) => {
    if (!currentChat) {
      handleNewChat();
    }
    sendMessage(prompt);
  };

  const sendMessage = async (text: string = inputMessage) => {
    if (!text.trim() || !currentChat) return;

    const newMessage: Message = {
      content: text,
      role: 'user',
      timestamp: new Date().toISOString()
    };

    // Update current chat
    const updatedChat = {
      ...currentChat,
      messages: [...currentChat.messages, newMessage]
    };

    // Update chats state
    setChats(prev => ({ ...prev, [updatedChat.id]: updatedChat }));
    setCurrentChat(updatedChat);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Send request to backend
      const walletAddress = localStorage.getItem('wallets') || '';
      const walletArray: NetworkData[] = JSON.parse(walletAddress);

      const response = await fetch('https://blockdawgs-backend-242842293866.asia-south1.run.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          messages: updatedChat.messages.map(msg => ({
            content: msg.content,
            role: msg.role,
          })),
          thread_id: updatedChat.id.toString(),
          sender_address: walletArray[0].address
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server');
      }

      // Handle both SSE format and regular JSON
      const jsonStr = responseText.includes('data: ') 
        ? responseText.replace('data: ', '') 
        : responseText;
      const data = JSON.parse(jsonStr);

      if(data.isExecute){

        // const transfer = await executeOktoTransfer({
        //   networkName: data.executePath.data.routes[0].fromChainName,
        //   tokenAddress: '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0', // MATIC token
        //   quantity: data.executePath.data.routes[0].inputAmount,
        //   recipientAddress: data.executePath.data.routes[0].receiverAddress
        // });
        
        // if (transfer.success) {
        //   console.log('Transfer successful! Order ID:', transfer.orderId);
        // } else {
        //   console.error('Transfer failed:', transfer.error);
        // }
      }

      // if(data.isExecute){
      //   // Executing the router and native blocks
        
      //   const executePath = data.executePath.data.routes;
      //   for(var i = 0; i < executePath.length; i++){
      //     console.log(executePath[i]);
      //     const protocol = executePath[i].protocol;
      //     if(protocol.toLowerCase() === 'router'){
      //       // Execute router transaction
      //       const walletAddress = localStorage.getItem('wallets') || '';
      //       const walletArray: NetworkData[] = JSON.parse(walletAddress);

      //       const response = await fetch(`${process.env.TRANSACTION_BACKEND}/api/transactions/build/router`, {
      //         method: 'POST',
      //         headers: {
      //           'Content-Type': 'application/json',
      //         },
      //         body: JSON.stringify({
      //           fromToken: executePath[i].fromToken,
      //           toToken: executePath[i].toToken,
      //           fromChainName: executePath[i].fromChainName,
      //           toChainName: executePath[i].toChainName,
      //           inputAmount: executePath[i].inputAmount
      //         })
      //       });

      //       const result = await response.json();
      //       console.log('Router transaction result:', result);
      //     }else if(protocol.toLowerCase() === 'native'){
      //       // Execute native transaction
      //     }else if(protocol.toLowerCase() === 'uniswap'){
      //       // Execute uniswap transaction
      //     }else if(protocol.toLowerCase() === 'lifi'){
      //       // Execute lifi transaction
      //     }else{
      //       continue
      //     }
      //   }

      //   //After execution
      //   const apiResult = 'Transactions completed successfully';
        // const aiResponse: StreamMessage = {
        //   content: apiResult,
        //   role: 'assistant',
        //   timestamp: new Date().toISOString(),
        //   isStreaming: false
        // };
      
        
        // const chatWithResponse = {
        //   ...updatedChat,
        //   messages: [...updatedChat.messages, aiResponse]
        // };
  
        // setChats(prev => ({ ...prev, [chatWithResponse.id]: chatWithResponse }));
        // setCurrentChat(chatWithResponse);
        
      // }
      // else{


      // Streaming response
      const aiResponse: StreamMessage = {
        content: data.content,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        isStreaming: false
      };
    
      
      const chatWithResponse = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiResponse]
      };

      setChats(prev => ({ ...prev, [chatWithResponse.id]: chatWithResponse }));
      setCurrentChat(chatWithResponse);
    
    } catch (error) {
      // console.error('Error:', error);
      // Handle error by adding an error message to the chat
      
      const errorMessage: StreamMessage = {
        content: 'Sorry,Your transaction could not go through due to insufficient balance.',
        role: 'assistant',
        timestamp: new Date().toISOString(),
        isStreaming: false
      };
      
      const chatWithError = {
        ...updatedChat,
        messages: [...updatedChat.messages, errorMessage]
      };

      setChats(prev => ({ ...prev, [chatWithError.id]: chatWithError }));
      setCurrentChat(chatWithError);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;

    // Create or get chat
    const chatId = currentChat?.id || Date.now().toString();
    const newUserMessage: Message = {
      role: 'user',
      content: inputMessage,
    };

    // Create new chat if none exists
    if (!currentChat) {
      const newChat: Chat = {
        id: chatId,
        messages: [newUserMessage],
      };
      setChats(prevChats => ({
        ...prevChats,
        [chatId]: newChat
      }));
      setCurrentChat(newChat);
    } else {
      // Update existing chat
      const updatedChat: Chat = {
        id: chatId,
        messages: [...currentChat.messages, newUserMessage],
      };
      setChats(prevChats => ({
        ...prevChats,
        [chatId]: updatedChat
      }));
      setCurrentChat(updatedChat);
    }

    // Clear input
    setInputMessage('');

    try {
      // Get current messages after state update
      const currentMessages = currentChat 
        ? [...currentChat.messages, newUserMessage]
        : [newUserMessage];

      // Send request to backend
      const walletAddress = localStorage.getItem('walletAddress') || '';
      const response = await fetch('https://blockdawgs-backend-242842293866.asia-south1.run.app/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          messages: currentMessages.map(msg => ({
            content: msg.content,
            role: msg.role
          })),
          thread_id: chatId.toString(), // Ensure thread_id is a string
          wallet: walletAddress
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response from server');
      }

      let data;
      try {
        // Handle both SSE format and regular JSON
        const jsonStr = responseText.includes('data: ') 
          ? responseText.replace('data: ', '') 
          : responseText;
        data = JSON.parse(jsonStr);
      } catch (e) {
        console.error('Failed to parse response:', responseText);
        console.log(e);
        throw new Error('Invalid JSON response from server');
      }

      if (!data || typeof data.content !== 'string' || data.role !== 'assistant') {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      // Add assistant's response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
      };

      setChats(prevChats => {
        const currentChat = prevChats[chatId];
        if (!currentChat) return prevChats;

        const updatedChat: Chat = {
          id: chatId,
          messages: [...currentChat.messages, assistantMessage],
        };

        return {
          ...prevChats,
          [chatId]: updatedChat
        };
      });

      setCurrentChat(prevChat => {
        if (!prevChat) return null;
        return {
          id: chatId,
          messages: [...prevChat.messages, assistantMessage],
        };
      });

    } catch (error) {
      // console.error('Error:', error);

      setChats(prevChats => {
        const currentChat = prevChats[chatId];
        if (!currentChat) return prevChats;

        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, We cannot process your transaction request due to insufficient balance.',
        };

        const updatedChat: Chat = {
          id: chatId,
          messages: [...currentChat.messages, errorMessage],
        };

        return {
          ...prevChats,
          [chatId]: updatedChat
        };
      });

      setCurrentChat(prevChat => {
        if (!prevChat) return null;
        
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, We cannot process your transaction request due to insufficient balance',
        };

        return {
          id: chatId,
          messages: [...prevChat.messages, errorMessage],
        };
      });
    }
  };

  const switchChat = (chat: Chat) => {
    setCurrentChat(chat);
    setIsSidebarVisible(false);
  };

  const toggleMode = () => {
    setChatMode(prev => prev === 'chat' ? 'command' : 'chat');
  };

  const handleDeleteChat = (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent chat selection when clicking delete
    const updatedChats = Object.fromEntries(Object.entries(chats).filter(([key]) => key !== chatId.toString()));
    setChats(updatedChats);
    
    // If the current chat is deleted, select the first available chat or null
    if (currentChat?.id === chatId) {
      setCurrentChat(Object.values(updatedChats)[0] || null);
    }
  };

  return (
    <div className="h-screen flex bg-[#0B0B0F] text-white overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarVisible && (
        <div 
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setIsSidebarVisible(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full
          w-72 
          bg-[#141419]
          transform transition-transform duration-300 ease-in-out
          ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'}
          z-30
          flex flex-col
          shadow-2xl
        `}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-white/5">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center space-x-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <div className="p-2 rounded-lg bg-white/5">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                <path d="M12 4L12 20M20 12L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {Object.values(chats).map((chat) => (
            <div 
              key={chat.id}
              className={`p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group flex items-center justify-between
                ${currentChat?.id === chat.id ? 'bg-white/5' : ''}`}
              onClick={() => switchChat(chat)}
            >
              <div className="flex items-center min-w-0 flex-1">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm mr-3 flex-shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <span className="text-sm text-white/70 truncate">
                  {chat.messages.length === 0 ? 'New Chat' : chat.messages[0].content}
                </span>
              </div>
              <button
                onClick={(e) => handleDeleteChat(chat.id, e)}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all ml-2 flex-shrink-0"
                title="Delete chat"
              >
                <svg className="w-4 h-4 text-white/40 hover:text-white/90" viewBox="0 0 24 24" fill="none">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center space-x-3">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-16 border-b border-white/5 flex items-center px-6 bg-[#0B0B0F] relative z-10">
          <button 
            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            aria-label={isSidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
          >
            <svg 
              className="w-5 h-5" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            >
              {isSidebarVisible ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <div className="ml-4 text-sm text-white/70 truncate">
            {currentChat?.messages.length === 0 ? 'New Chat' : currentChat?.messages[0].content}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto py-8 px-4">
            {/* Welcome Section */}
            {(!currentChat || currentChat.messages.length === 0) && (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
                    <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-medium mb-2">{currentChat?.title}</h1>
                <p className="text-white/60 mb-8">How can I help you today?</p>

                {/* Quick Action Buttons */}
                <div className="inline-flex rounded-full p-1 bg-white/5">
                  <button 
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${chatMode === 'chat' ? 'bg-purple-500 text-white' : 'text-white/60 hover:text-white'}`}
                    onClick={toggleMode}
                  >
                    Chat Mode
                  </button>
                  <button 
                    className={`px-4 py-2 rounded-full text-sm transition-colors ${chatMode === 'command' ? 'bg-purple-500 text-white' : 'text-white/60 hover:text-white'}`}
                    onClick={toggleMode}
                  >
                    Command Mode
                  </button>
                </div>

                {/* Quick Links */}
                <div className="grid grid-cols-3 gap-4 mt-12">
                  {quickActions.map((action, index) => (
                    <button 
                      key={index} 
                      className="p-6 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                      onClick={action.action}
                    >
                      <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 mx-auto">
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                          <path d="M12 6v6m0 0v6m0-6h6m-6 0H6a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium mb-1">{action.title}</h3>
                      <p className="text-xs text-white/40 group-hover:text-white/60 transition-colors">{action.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {currentChat && currentChat.messages.map((message, index) => (
              <div 
                key={`${currentChat.id}-${index}`}
                className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} message-appear`}
                style={{ 
                  animationDelay: `${index * 100}ms`,
                  opacity: 0,
                }}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    message.role === 'user' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white/5 text-white/90'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <ReactMarkdown
                      className="leading-relaxed prose prose-invert prose-sm max-w-none"
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Override pre and code block styling
                        pre: ({ node, ...props }) => (
                          <pre className="bg-black/30 rounded-lg p-2 my-2 overflow-x-auto" {...props} />
                        ),
                        code: ({ node, inline, ...props }) => (
                          inline 
                            ? <code className="bg-black/30 rounded px-1 py-0.5" {...props} />
                            : <code className="block" {...props} />
                        ),
                        // Style links
                        a: ({ node, ...props }) => (
                          <a className="text-purple-400 hover:text-purple-300 underline" {...props} />
                        ),
                        // Style lists
                        ul: ({ node, ...props }) => (
                          <ul className="list-disc list-inside my-2" {...props} />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol className="list-decimal list-inside my-2" {...props} />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    <p className="leading-relaxed">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center space-x-2 text-white/40">
                <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></div>
                <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-white/5 p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Message Assistant..."
                className="w-full bg-white/5 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-white/40"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-colors"
                disabled={!inputMessage.trim()}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}