import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { askChatbot } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import WellsMap from '../components/WellsMap.jsx';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳' }
];

const ChatbotPage = () => {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isGuest = user?.role === 'guest';
  
  const [showSettings, setShowSettings] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ingres_chat_settings');
      return saved ? JSON.parse(saved) : {
        fontSize: 'medium',
        bubbleStyle: 'rounded',
        showTimestamps: true,
        soundEnabled: false,
        autoSpeak: false
      };
    } catch (error) {
      console.warn('Failed to parse chat settings:', error);
      localStorage.removeItem('ingres_chat_settings');
      return {
        fontSize: 'medium',
        bubbleStyle: 'rounded',
        showTimestamps: true,
        soundEnabled: false,
        autoSpeak: false
      };
    }
  });

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      if (synthRef.current) {
        // Trigger voice loading
        synthRef.current.getVoices();
      }
    };
    
    loadVoices();
    
    // Some browsers need this event
    if (synthRef.current && synthRef.current.onvoiceschanged !== undefined) {
      synthRef.current.onvoiceschanged = loadVoices;
    }
    
    // Also try after a delay
    setTimeout(loadVoices, 500);
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      // Set language for speech recognition
      const langMap = { en: 'en-US', ta: 'ta-IN', hi: 'hi-IN', te: 'te-IN' };
      recognitionRef.current.lang = langMap[language] || 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      setVoiceEnabled(true);
    }
  }, [language]);

  // Update speech recognition language when language changes
  useEffect(() => {
    if (recognitionRef.current) {
      const langMap = { en: 'en-US', ta: 'ta-IN', hi: 'hi-IN', te: 'te-IN' };
      recognitionRef.current.lang = langMap[language] || 'en-US';
    }
  }, [language]);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('ingres_chat_settings', JSON.stringify(settings));
  }, [settings]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const getGreeting = () => {
    const greetings = {
      en: `Welcome! 👋 I'm the INGRES groundwater assistant. I've got data on wells across Tamil Nadu — ask me about TDS levels, yields, water depths, or specific wells. Try "give me an overview" to get started!`,
      ta: `வணக்கம்! 👋 நான் INGRES நிலத்தடி நீர் உதவியாளர். தமிழ்நாடு முழுவதும் உள்ள கிணறுகளின் தரவு உள்ளது — TDS, விளைச்சல், நீர் ஆழம் பற்றி கேளுங்கள்!`,
      hi: `नमस्ते! 👋 मैं INGRES भूजल सहायक हूं। तमिलनाडु के कुओं का डेटा है — TDS, उपज, जल गहराई के बारे में पूछें!`,
      te: `నమస్కారం! 👋 నేను INGRES భూగర్భజల సహాయకుడిని. తమిళనాడు బావుల డేటా ఉంది — TDS, దిగుబడి, నీటి లోతు గురించి అడగండి!`
    };
    return greetings[language] || greetings.en;
  };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: getGreeting(),
      timestamp: new Date()
    }
  ]);
  
  // Update greeting when language changes
  useEffect(() => {
    if (messages.length === 1) {
      setMessages([{
        role: 'assistant',
        text: getGreeting(),
        timestamp: new Date()
      }]);
    }
  }, [language]);

  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const defaultSuggestions = {
    en: ["Give me an overview", "Show high-risk areas", "TDS levels", "Contact support"],
    ta: ["கண்ணோட்டம் தருங்கள்", "ஆபத்து பகுதிகள்", "TDS நிலை", "தொடர்பு ஆதரவு"],
    hi: ["अवलोकन दें", "उच्च जोखिम क्षेत्र", "TDS स्तर", "संपर्क सहायता"],
    te: ["అవలోకనం ఇవ్వండి", "అధిక ప్రమాద ప్రాంతాలు", "TDS స్థాయిలు", "సంప్రదింపు మద్దతు"]
  };

  useEffect(() => {
    setSuggestions(defaultSuggestions[language] || defaultSuggestions.en);
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  // Parse and render formatted text (converts **bold** to <strong>)
  const renderFormattedText = (text) => {
    if (!text) return null;
    
    // Split by **bold** markers and render
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    
    return parts.map((part, index) => {
      // Odd indices are the bold parts (content between **)
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
      }
      return part;
    });
  };

  // Get voices - ensures voices are loaded
  const getVoices = useCallback(() => {
    if (!synthRef.current) return [];
    const voices = synthRef.current.getVoices();
    return voices.length > 0 ? voices : [];
  }, []);

  // Text-to-speech function - works for both manual click and auto-speak
  const speak = useCallback((text, forceSpeak = false) => {
    if (!synthRef.current) return;
    
    // If not forcing (manual click) and autoSpeak is disabled, skip
    if (!forceSpeak && !settings.autoSpeak) return;
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    // Clean up text for better speech - remove markdown formatting
    const cleanText = text
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '')   // Remove italic markers
      .replace(/•/g, '')    // Remove bullet points
      .replace(/📍|📊|💧|⚠️|📈|📝|📞|🏛️|🌊|🏭|🚨|✅|🟡|🔴|🟢|🔧|🏆|ℹ️|🔢/g, '') // Remove emojis
      .replace(/\n\s*\n/g, '. ') // Replace double newlines with period
      .replace(/\n/g, '. ')      // Replace single newlines with period
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();
    
    if (!cleanText) return;
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langMap = { 
      en: 'en-US', 
      ta: 'ta-IN', 
      hi: 'hi-IN', 
      te: 'te-IN' 
    };
    
    const langCode = langMap[language] || 'en-US';
    utterance.lang = langCode;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Function to find and set the best voice for the language
    const findAndSetVoice = () => {
      const voices = getVoices();
      
      if (voices.length === 0) {
        // If voices not loaded yet, wait and retry
        setTimeout(() => {
          const retryVoices = synthRef.current?.getVoices() || [];
          if (retryVoices.length > 0) {
            const preferredVoice = retryVoices.find(v => {
              const vLang = v.lang.toLowerCase();
              const vName = v.name.toLowerCase();
              
              // Exact match
              if (vLang === langCode.toLowerCase()) return true;
              
              // Language code match
              const langPrefix = langCode.split('-')[0].toLowerCase();
              if (vLang.startsWith(langPrefix)) return true;
              
              // Name-based matching for Indian languages
              if (language === 'ta' && (vLang.includes('ta') || vName.includes('tamil'))) return true;
              if (language === 'hi' && (vLang.includes('hi') || vName.includes('hindi'))) return true;
              if (language === 'te' && (vLang.includes('te') || vName.includes('telugu'))) return true;
              
              return false;
            });
            
            if (preferredVoice) {
              utterance.voice = preferredVoice;
            }
            synthRef.current.speak(utterance);
          } else {
            // Fallback: speak without specific voice
            synthRef.current.speak(utterance);
          }
        }, 300);
        return;
      }
      
      // Find the best matching voice
      const preferredVoice = voices.find(v => {
        const vLang = v.lang.toLowerCase();
        const vName = v.name.toLowerCase();
        
        // Exact match
        if (vLang === langCode.toLowerCase()) return true;
        
        // Language code match
        const langPrefix = langCode.split('-')[0].toLowerCase();
        if (vLang.startsWith(langPrefix)) return true;
        
        // Name-based matching for Indian languages
        if (language === 'ta' && (vLang.includes('ta') || vName.includes('tamil'))) return true;
        if (language === 'hi' && (vLang.includes('hi') || vName.includes('hindi'))) return true;
        if (language === 'te' && (vLang.includes('te') || vName.includes('telugu'))) return true;
        
        return false;
      });
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      
      synthRef.current.speak(utterance);
    };
    
    // Try to set voice immediately
    findAndSetVoice();
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      setIsSpeaking(false);
    };
  }, [language, settings.autoSpeak, getVoices]);
  
  // Manual speak function for button clicks
  const speakManual = useCallback((text) => {
    speak(text, true); // Force speak regardless of autoSpeak setting
  }, [speak]);

  // Voice input toggle
  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const sendMessage = async (text) => {
    const trimmed = text?.trim() || input.trim();
    if (!trimmed) return;

    const userMessage = { role: 'user', text: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);
    setIsTyping(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 800));
      
      const response = await askChatbot(trimmed, token, language);
      setIsTyping(false);
      
      const assistantMessage = { role: 'assistant', text: response.reply, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Update suggestions from response
      if (response.suggestions?.length) {
        setSuggestions(response.suggestions);
      }
      
      // Auto-speak response if enabled
      if (settings.autoSpeak) {
        speak(response.reply);
      }
    } catch (err) {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: language === 'ta' ? 'தரவு சேவையை அடைய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.' :
                language === 'hi' ? 'डेटा सेवा से कनेक्ट नहीं हो पा रहा। फिर से प्रयास करें।' :
                language === 'te' ? 'డేటా సేవను చేరుకోలేకపోయాను. మళ్ళీ ప్రయత్నించండి.' :
                "Hmm, I'm having trouble connecting to the data service. Mind trying again?",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleSuggestionClick = (suggestion) => {
    sendMessage(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleWellSelect = (well) => {
    const query = language === 'ta' ? `${well.name} பற்றி சொல்லுங்கள்` :
                  language === 'hi' ? `${well.name} के बारे में बताएं` :
                  language === 'te' ? `${well.name} గురించి చెప్పండి` :
                  `Tell me about ${well.name}`;
    sendMessage(query);
    setShowMap(false);
  };

  return (
    <div className="chatbot-page">
      <header className="chatbot-header">
        <div className="chatbot-header-left">
          {user?.role === 'guest' ? (
            <Link to="/login" className="back-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              <span>Sign in</span>
            </Link>
          ) : (
            <Link to={`/${user?.role || 'login'}`} className="back-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Dashboard</span>
            </Link>
          )}
        </div>
        
        <div className="chatbot-header-center">
          <div className="assistant-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
              <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1>INGRES CHATBOT</h1>
            <span className="status-indicator">
              <span className="status-dot"></span>
              Online • {LANGUAGES.find(l => l.code === language)?.name}
            </span>
          </div>
        </div>
        
        <div className="chatbot-header-right">
          {/* Language Selector */}
          <div className="language-selector">
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="language-select"
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Map Toggle */}
          <button 
            type="button" 
            className={`header-icon-btn ${showMap ? 'active' : ''}`}
            onClick={() => setShowMap(!showMap)}
            aria-label="Toggle Map"
            title="View Wells Map"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </button>
          
          <button 
            type="button" 
            className="header-icon-btn"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Settings"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>
          
          <button 
            type="button" 
            className="header-icon-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
          </button>
          
          <button 
            type="button" 
            className="header-icon-btn logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Chat Settings</h3>
            <button type="button" className="settings-close" onClick={() => setShowSettings(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          
          <div className="settings-group">
            <label className="settings-label">Font Size</label>
            <div className="settings-options">
              {['small', 'medium', 'large'].map(size => (
                <button
                  key={size}
                  type="button"
                  className={`settings-option ${settings.fontSize === size ? 'active' : ''}`}
                  onClick={() => updateSetting('fontSize', size)}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-label">Bubble Style</label>
            <div className="settings-options">
              {['rounded', 'square', 'minimal'].map(style => (
                <button
                  key={style}
                  type="button"
                  className={`settings-option ${settings.bubbleStyle === style ? 'active' : ''}`}
                  onClick={() => updateSetting('bubbleStyle', style)}
                >
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-toggle-label">
              <span>Show Timestamps</span>
              <button
                type="button"
                className={`toggle-switch ${settings.showTimestamps ? 'active' : ''}`}
                onClick={() => updateSetting('showTimestamps', !settings.showTimestamps)}
              >
                <span className="toggle-slider"></span>
              </button>
            </label>
          </div>

          <div className="settings-group">
            <label className="settings-toggle-label">
              <span>Auto-Speak Responses</span>
              <button
                type="button"
                className={`toggle-switch ${settings.autoSpeak ? 'active' : ''}`}
                onClick={() => updateSetting('autoSpeak', !settings.autoSpeak)}
              >
                <span className="toggle-slider"></span>
              </button>
            </label>
          </div>

          <div className="settings-footer">
            <button 
              type="button" 
              className="settings-reset"
              onClick={() => setSettings({
                fontSize: 'medium',
                bubbleStyle: 'rounded',
                showTimestamps: true,
                soundEnabled: false,
                autoSpeak: false
              })}
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      {/* Map Panel */}
      {showMap && (
        <div className="map-panel">
          <div className="map-panel-header">
            <h3>🗺️ Wells Map</h3>
            <button type="button" className="close-btn" onClick={() => setShowMap(false)}>×</button>
          </div>
          <WellsMap token={token} onWellSelect={handleWellSelect} />
        </div>
      )}

      <main className={`chatbot-messages font-${settings.fontSize} bubble-${settings.bubbleStyle}`}>
        <div className="messages-container">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message-wrapper ${msg.role}`}>
              {msg.role === 'assistant' && (
                <div className="message-avatar">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                    <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
                    <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              <div className={`message ${msg.role}`}>
                <p>{renderFormattedText(msg.text)}</p>
                {settings.showTimestamps && (
                  <span className="message-time">{formatTime(msg.timestamp)}</span>
                )}
              </div>
              {msg.role === 'assistant' && (
                <button 
                  type="button" 
                  className="speak-btn"
                  onClick={() => speakManual(msg.text)}
                  title="Read aloud"
                >
                  {isSpeaking ? '🔇' : '🔊'}
                </button>
              )}
            </div>
          ))}
          
          {isTyping && (
            <div className="message-wrapper assistant">
              <div className="message-avatar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3" strokeLinecap="round" />
                  <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </div>
              <div className="message assistant typing">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="chatbot-footer">
        <div className="suggestions-row">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="suggestion-chip"
              onClick={() => handleSuggestionClick(suggestion)}
              disabled={isSending}
            >
              {suggestion}
            </button>
          ))}
        </div>
        
        <form className="chat-form" onSubmit={handleSubmit}>
          {/* Voice Input Button */}
          {voiceEnabled && (
            <button 
              type="button" 
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={toggleListening}
              disabled={isSending}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              )}
            </button>
          )}
          
          <input
            ref={inputRef}
            type="text"
            placeholder={
              language === 'ta' ? 'நிலத்தடி நீர் பற்றி கேளுங்கள்...' :
              language === 'hi' ? 'भूजल के बारे में पूछें...' :
              language === 'te' ? 'భూగర్భజలం గురించి అడగండి...' :
              'Ask me anything about groundwater...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSending}
          />
          
          {/* Stop Speaking Button */}
          {isSpeaking && (
            <button 
              type="button" 
              className="stop-speak-btn"
              onClick={stopSpeaking}
              title="Stop speaking"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            </button>
          )}
          
          <button type="submit" disabled={isSending || !input.trim()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default ChatbotPage;
