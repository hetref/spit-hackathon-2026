"use client";

/**
 * AI CHAT COPILOT
 *
 * Conversational AI assistant for the website builder.
 * Features:
 * - Floating panel UI (400px width, max 600px height)
 * - Real-time streaming responses
 * - Chat history persistence per page
 * - Collapse/expand functionality
 * - Auto-scroll to latest messages
 * - Keyboard shortcuts (Enter to send, Escape to close)
 */

import { useState, useEffect, useRef } from "react";
import { X, Minimize2, Maximize2, Send, Lightbulb } from "lucide-react";
import useChatStore from "@/lib/stores/chatStore";
import useBuilderStore from "@/lib/stores/builderStore";
import { parseAIResponse, isUndoCommand } from "@/lib/ai/commandParser";
import { executeActions } from "@/lib/ai/actionExecutor";

export default function AIChatCopilot({ tenantId, siteId }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Store hooks
  const {
    messages,
    isStreaming,
    currentStreamingId,
    addMessage,
    updateStreamingMessage,
    completeStreaming,
    startStreaming,
    loadHistory,
    getContextMessages,
  } = useChatStore();

  const builderStore = useBuilderStore();
  const { pageId, selectedNodeId } = builderStore;

  // Load chat history when page changes
  useEffect(() => {
    if (pageId) {
      loadHistory(pageId);
    }
  }, [pageId, loadHistory]);

  // Auto-scroll to latest message
  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !isCollapsed && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isCollapsed]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isSending || isStreaming) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    try {
      // Check for undo command
      if (isUndoCommand(userMessage)) {
        handleUndoCommand();
        return;
      }

      // Add user message to chat
      addMessage({
        role: "user",
        content: userMessage,
      });

      // Build context for AI request
      const context = buildContext();

      // Send to AI API with streaming
      await sendChatMessage(userMessage, context);
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      addMessage({
        role: "assistant",
        content: "I'm having trouble connecting. Please check your internet and try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleUndoCommand = () => {
    const success = builderStore.performUndo();
    
    const responseText = success
      ? "I've undone the last change. Your page has been restored to its previous state."
      : "There's nothing to undo right now.";

    addMessage({
      role: "assistant",
      content: responseText,
    });

    setIsSending(false);
  };

  const buildContext = () => {
    const layoutJSON = builderStore.getLayoutJSON();
    const chatHistory = getContextMessages(20);

    return {
      layoutJSON,
      brandKit: null, // Will be fetched from API in next task
      chatHistory: chatHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
      })),
      selectedComponentId: selectedNodeId,
      pageId,
    };
  };

  const sendChatMessage = async (message, context) => {
    // Create AI message placeholder for streaming
    const aiMessageId = `ai-${Date.now()}`;
    addMessage({
      id: aiMessageId,
      role: "assistant",
      content: "",
      isStreaming: true,
    });

    startStreaming(aiMessageId);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Read streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      let displayedText = "";

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        
        // Extract text before JSON block for streaming display
        const jsonStart = fullResponse.indexOf('```json');
        if (jsonStart === -1) {
          // No JSON block yet, show everything
          displayedText = fullResponse;
          updateStreamingMessage(aiMessageId, displayedText);
        } else {
          // JSON block started, only show text before it
          displayedText = fullResponse.substring(0, jsonStart).trim();
          updateStreamingMessage(aiMessageId, displayedText);
        }
      }

      // Parse complete response for actions
      const parsed = parseAIResponse(fullResponse);
      
      // Update message with final parsed text
      const finalText = parsed.text || displayedText || fullResponse;
      updateStreamingMessage(aiMessageId, finalText);
      
      // Complete streaming
      completeStreaming(aiMessageId, parsed.actions);

      // Execute actions if any
      if (parsed.actions && parsed.actions.length > 0) {
        const result = await executeActions(parsed.actions, builderStore);
        
        // Log execution results
        console.log("Action execution result:", result);
        
        // If there were failures, add a follow-up message
        if (result.failureCount > 0) {
          const failedActions = result.results
            .filter((r) => !r.success)
            .map((r) => r.errors.join(", "))
            .join("; ");
          
          addMessage({
            role: "assistant",
            content: `Note: Some actions couldn't be completed: ${failedActions}`,
          });
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      
      // Update message with error
      completeStreaming(aiMessageId);
      addMessage({
        role: "assistant",
        content: "I encountered an error processing your request. Please try again.",
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEscape = (e) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        aria-label="Open AI Chat Assistant"
      >
        <Lightbulb className="w-6 h-6" />
      </button>
    );
  }

  if (isCollapsed) {
    return (
      <div className="fixed bottom-6 left-6 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="text-sm font-medium text-gray-700">AI Assistant</span>
          <div className="flex gap-2">
            <button
              onClick={() => setIsCollapsed(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Expand chat"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-6 left-6 w-[400px] max-h-[600px] bg-white rounded-lg shadow-xl border border-gray-200 flex flex-col z-50"
      role="complementary"
      aria-label="AI Chat Assistant"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Minimize chat"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Hi! I'm your AI assistant.</p>
            <p className="mt-1">Ask me to add components, change styles, or modify your page.</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={message.id === currentStreamingId}
          />
        ))}

        {isStreaming && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
            maxLength={1000}
            disabled={isSending || isStreaming}
            aria-label="Type your message"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending || isStreaming}
            className="self-end bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-1 text-xs text-gray-500 text-right">
          {inputValue.length}/1000
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MESSAGE BUBBLE COMPONENT
// ============================================================================

function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      role="article"
      aria-label={`${message.role} message`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-900"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap wrap-break-word">
          {message.content}
        </p>
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
}
