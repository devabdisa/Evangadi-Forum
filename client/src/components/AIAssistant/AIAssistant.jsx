import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API } from '../../API/apiService';
import './AIAssistant.css';

const AIAssistant = ({ isOpen, onClose, initialMessage = '' }) => {
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState(initialMessage);
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showConversations, setShowConversations] = useState(false);
  const [mode, setMode] = useState('chat'); // 'chat' or 'code-help'
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadConversations();
      if (initialMessage) {
        handleSendMessage(initialMessage);
      }
    }
  }, [isOpen, isAuthenticated, initialMessage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await API.ai.getConversations();
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      const response = await API.ai.getConversationMessages(conversationId);
      setMessages(response.messages || []);
      setCurrentConversationId(conversationId);
      setShowConversations(false);
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || !isAuthenticated) return;

    const userMessage = {
      message: messageText.trim(),
      is_ai: false,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await API.ai.chatWithAI({
        message: messageText.trim(),
        conversationId: currentConversationId
      });

      const aiMessage = {
        message: response.response,
        is_ai: true,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      if (response.conversationId) {
        setCurrentConversationId(response.conversationId);
        loadConversations(); // Refresh conversations list
      }
    } catch (error) {
      const errorMessage = {
        message: 'Sorry, I encountered an error. Please try again.',
        is_ai: true,
        created_at: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeHelp = async () => {
    if (!inputMessage.trim()) return;

    setMode('code-help');
    await handleSendMessage(`Help me with this code: ${inputMessage}`);
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowConversations(false);
  };

  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className={`ai-assistant ${isOpen ? 'open' : ''}`}>
        <div className="ai-assistant-content">
          <div className="auth-required-message">
            <div className="ai-icon">🤖</div>
            <h3>AI Assistant</h3>
            <p>Please log in to use the AI assistant.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ai-assistant ${isOpen ? 'open' : ''}`}>
      <div className="ai-assistant-header">
        <div className="ai-header-info">
          <div className="ai-icon">🤖</div>
          <div className="ai-title">
            <h3>AI Assistant</h3>
            <p>Free coding help & explanations</p>
          </div>
        </div>

        <div className="ai-header-actions">
          <button
            onClick={() => setShowConversations(!showConversations)}
            className="btn-icon"
            title="Conversation History"
          >
            📚
          </button>
          <button
            onClick={startNewConversation}
            className="btn-icon"
            title="New Conversation"
          >
            ➕
          </button>
          <button onClick={onClose} className="btn-icon" title="Close">
            ✕
          </button>
        </div>
      </div>

      {showConversations && (
        <div className="conversations-sidebar">
          <div className="conversations-header">
            <h4>Conversations</h4>
            <button onClick={() => setShowConversations(false)} className="btn-icon">
              ✕
            </button>
          </div>
          <div className="conversations-list">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conversation-item ${currentConversationId === conv.id ? 'active' : ''}`}
                onClick={() => loadConversation(conv.id)}
              >
                <div className="conversation-title">
                  {conv.title.length > 50 ? `${conv.title.substring(0, 50)}...` : conv.title}
                </div>
                <div className="conversation-meta">
                  {conv.message_count} messages • {formatMessageTime(conv.updated_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ai-messages">
        {messages.length === 0 ? (
          <div className="ai-welcome">
            <div className="welcome-icon">🚀</div>
            <h4>I'm ready to help with your coding questions!</h4>
            <p>I can help you debug code, explain concepts, optimize performance, and solve programming problems. Just ask me anything!</p>

            <div className="mode-selector">
              <button
                className={`mode-btn ${mode === 'chat' ? 'active' : ''}`}
                onClick={() => setMode('chat')}
              >
                💬 General Chat
              </button>
              <button
                className={`mode-btn ${mode === 'code-help' ? 'active' : ''}`}
                onClick={() => setMode('code-help')}
              >
                💻 Code Help
              </button>
            </div>

            <div className="example-prompts">
              <p>Try asking:</p>
              <button
                className="example-btn"
                onClick={() => setInputMessage('How do I fix this JavaScript error?')}
              >
                "How do I fix this JavaScript error?"
              </button>
              <button
                className="example-btn"
                onClick={() => setInputMessage('Help me understand this React code')}
              >
                "Help me understand this React code"
              </button>
              <button
                className="example-btn"
                onClick={() => setInputMessage('How to improve my code performance?')}
              >
                "How to improve my code performance?"
              </button>
              <button
                className="example-btn"
                onClick={() => setInputMessage('Best practices for Node.js development')}
              >
                "Best practices for Node.js development"
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.is_ai ? 'ai-message' : 'user-message'} ${msg.isError ? 'error-message' : ''}`}>
              <div className="message-avatar">
                {msg.is_ai ? '🤖' : '👤'}
              </div>
              <div className="message-content">
                <div className="message-text">{msg.message}</div>
                <div className="message-time">
                  {formatMessageTime(msg.created_at)}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="message ai-message loading">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="message-text">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-input-area">
        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              mode === 'code-help'
                ? 'Paste your code here and ask me to explain, debug, or improve it...'
                : 'Ask me about JavaScript, React, debugging, best practices, or any coding question...'
            }
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={3}
            className="ai-input"
          />

          <div className="input-actions">
            {mode === 'code-help' && (
              <button
                onClick={() => setMode('chat')}
                className="mode-toggle-btn"
                title="Switch to general chat"
              >
                💬
              </button>
            )}

            {mode === 'chat' && (
              <button
                onClick={() => setMode('code-help')}
                className="mode-toggle-btn"
                title="Switch to code help mode"
              >
                💻
              </button>
            )}

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="send-btn"
            >
              {isLoading ? '⏳' : '🚀'}
            </button>
          </div>
        </div>

        {mode === 'code-help' && (
          <div className="code-help-hint">
            💡 <strong>Code Help Mode:</strong> Paste your code and ask questions like "explain this", "debug this", "optimize this", or "convert this to..."
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;