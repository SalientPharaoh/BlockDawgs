"use client";

import React from 'react';
import { Chat } from '../../../types';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { PanelLeftClose, Plus } from 'lucide-react';
import LogoSection from './LogoSection';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  currentChat: Chat | null;
  onChatSelect: (chat: Chat | null) => void;
  isGlobalView: boolean;
  setIsGlobalView: (value: boolean) => void;
  onNewChat: () => void;
  onDeleteChat: (chatId: number) => void;
  onToggleGlobalView: () => void;
  isLoading: boolean;
  setIsSidebarOpen: (value: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  chats,
  currentChat,
  onChatSelect,
  isGlobalView,
  setIsGlobalView,
  onNewChat,
  onDeleteChat,
  onToggleGlobalView,
  isLoading,
  setIsSidebarOpen
}) => {
  return (
    <div
      className={cn(
        'fixed left-0 top-0 z-50 flex h-full w-72 flex-col bg-[#0a0a0a] shadow-xl transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-[#1a0c26]">
        <LogoSection words="BlockDawgs AI" />
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8"
        >
          <PanelLeftClose className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Button
          onClick={onNewChat}
          className="mb-4 w-full bg-[#6c5dd3] hover:bg-[#4b3f9d] text-white"
          disabled={isLoading}
        >
          <Plus className="mr-2 h-5 w-5" />
          New Chat
        </Button>

        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-2">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                onClick={() => onChatSelect(chat)}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  currentChat?.id === chat.id
                    ? 'bg-[#6c5dd3] text-white hover:bg-[#4b3f9d]'
                    : 'hover:bg-[#1a1c26]'
                )}
              >
                <span className="truncate">{chat.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Sidebar;