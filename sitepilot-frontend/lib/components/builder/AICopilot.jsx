'use client';

import { useState, useEffect } from 'react';
import { Sparkles, X, ChevronDown, ChevronUp, Loader2, Lightbulb, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import useBuilderStore from '@/lib/stores/builderStore';
import { nanoid } from 'nanoid';

export default function AICopilot({ tenantId, siteId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);

  const { layoutJSON, addContainer } = useBuilderStore();

  // Auto-analyze when page loads or changes significantly
  useEffect(() => {
    const timer = setTimeout(() => {
      if (layoutJSON && !lastAnalyzed) {
        analyzePage();
      }
    }, 2000); // Wait 2 seconds after page load

    return () => clearTimeout(timer);
  }, [layoutJSON]);

  async function analyzePage() {
    if (analyzing) return;

    try {
      setAnalyzing(true);
      setIsOpen(true);

      // Fetch brand kit
      let brandKit = null;
      try {
        const brandRes = await fetch(`/api/tenants/${tenantId}/brand-kit`);
        if (brandRes.ok) {
          const brandData = await brandRes.json();
          brandKit = brandData.brandKit;
        }
      } catch (e) {
        console.warn('Could not fetch brand kit:', e);
      }

      const res = await fetch('/api/ai/analyze-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutJSON, brandKit }),
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      
      // Filter out suggestions with invalid component types
      const validComponentTypes = ['Hero', 'CTA', 'Features', 'FormEmbed', 'Text', 'Heading', 'Image', 'Button', 'Gallery', 'Video', 'Map', 'Navbar', 'Footer'];
      const validSuggestions = (data.suggestions || []).filter(s => {
        if (s.action?.type === 'add_component') {
          return validComponentTypes.includes(s.action.componentType);
        }
        return true; // Keep non-add_component suggestions
      });
      
      setSuggestions(validSuggestions);
      setLastAnalyzed(new Date());
    } catch (error) {
      console.error('Error analyzing page:', error);
    } finally {
      setAnalyzing(false);
    }
  }

  async function applySuggestion(suggestion) {
    try {
      setLoading(true);

      const action = suggestion.action;

      if (action.type === 'add_component') {
        // Generate component data based on type
        const componentData = generateComponentData(action.componentType);

        // Create new container with the component
        const newContainer = {
          id: `container-${nanoid()}`,
          type: 'container',
          settings: {
            direction: 'horizontal',
            contentWidth: 'boxed',
            maxWidth: 1280,
            gap: 16,
            verticalAlign: 'stretch',
          },
          styles: {
            backgroundColor: '#ffffff',
            paddingTop: 60,
            paddingBottom: 60,
          },
          columns: [
            {
              id: `col-${nanoid()}`,
              width: 12,
              components: [componentData],
            },
          ],
        };

        // Add to top or bottom based on position
        if (action.position === 'top') {
          const currentContainers = layoutJSON.pages[0].containers || [];
          useBuilderStore.setState(state => ({
            layoutJSON: {
              ...state.layoutJSON,
              pages: [
                {
                  ...state.layoutJSON.pages[0],
                  containers: [newContainer, ...currentContainers],
                },
              ],
            },
          }));
        } else {
          addContainer(newContainer);
        }

        // Remove applied suggestion
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

        // Show success message
        alert(`✨ ${suggestion.title} applied successfully!`);
      }
    } catch (error) {
      console.error('Error applying suggestion:', error);
      alert('Failed to apply suggestion');
    } finally {
      setLoading(false);
    }
  }

  function generateComponentData(componentType) {
    const id = `${componentType.toLowerCase()}-${nanoid()}`;

    const templates = {
      Hero: {
        id,
        type: 'Hero',
        props: {
          title: 'Transform Your Business Today',
          subtitle: 'Discover how our solution can help you achieve your goals faster',
          ctaText: 'Get Started',
          ctaLink: '#contact',
          backgroundImage: '',
        },
        styles: {
          backgroundColor: '#f3f4f6',
          textColor: '#1f2937',
          paddingTop: 80,
          paddingBottom: 80,
        },
      },
      CTA: {
        id,
        type: 'CTA',
        props: {
          title: 'Ready to Get Started?',
          description: 'Join thousands of satisfied customers today',
          buttonText: 'Start Free Trial',
          buttonLink: '#signup',
        },
        styles: {
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
          paddingTop: 60,
          paddingBottom: 60,
        },
      },
      Features: {
        id,
        type: 'Features',
        props: {
          heading: 'Why Choose Us',
          items: [
            {
              icon: '⚡',
              title: 'Fast & Reliable',
              description: 'Lightning-fast performance you can count on',
            },
            {
              icon: '🔒',
              title: 'Secure',
              description: 'Enterprise-grade security for your peace of mind',
            },
            {
              icon: '💡',
              title: 'Easy to Use',
              description: 'Intuitive interface that anyone can master',
            },
          ],
        },
        styles: {
          backgroundColor: '#ffffff',
          paddingTop: 60,
          paddingBottom: 60,
        },
      },
      FormEmbed: {
        id,
        type: 'FormEmbed',
        props: {
          formId: null,
          title: 'Get in Touch',
          description: 'Fill out the form below and we\'ll get back to you soon',
        },
        styles: {
          backgroundColor: '#f9fafb',
          paddingTop: 60,
          paddingBottom: 60,
        },
      },
      Text: {
        id,
        type: 'Text',
        props: {
          content: 'Add your compelling content here to engage your visitors and communicate your message effectively.',
          variant: 'p',
        },
        styles: {
          textAlign: 'left',
          fontSize: 16,
          color: '#374151',
        },
      },
      Heading: {
        id,
        type: 'Heading',
        props: {
          text: 'Section Heading',
          level: 'h2',
        },
        styles: {
          textAlign: 'center',
          fontSize: 36,
          color: '#1f2937',
        },
      },
      Button: {
        id,
        type: 'Button',
        props: {
          text: 'Click Here',
          link: '#',
          variant: 'primary',
        },
        styles: {
          backgroundColor: '#3b82f6',
          textColor: '#ffffff',
        },
      },
      Image: {
        id,
        type: 'Image',
        props: {
          src: 'https://via.placeholder.com/800x400',
          alt: 'Placeholder image',
          width: 800,
          height: 400,
        },
        styles: {},
      },
      Gallery: {
        id,
        type: 'Gallery',
        props: {
          images: [
            { src: 'https://via.placeholder.com/400x300', alt: 'Gallery image 1' },
            { src: 'https://via.placeholder.com/400x300', alt: 'Gallery image 2' },
            { src: 'https://via.placeholder.com/400x300', alt: 'Gallery image 3' },
          ],
        },
        styles: {
          paddingTop: 40,
          paddingBottom: 40,
        },
      },
      Video: {
        id,
        type: 'Video',
        props: {
          url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          title: 'Video',
        },
        styles: {
          paddingTop: 40,
          paddingBottom: 40,
        },
      },
    };

    // Return template or fallback to Text
    return templates[componentType] || templates.Text;
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'medium':
        return <TrendingUp className="w-4 h-4 text-yellow-500" />;
      default:
        return <Lightbulb className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[200] flex items-center justify-between gap-3 p-3 pr-6 bg-white border border-gray-100 text-[#0b1411] rounded-full shadow-2xl hover:border-[#8bc4b1] hover:-translate-y-1 active:scale-95 transition-all font-black text-[10px] uppercase tracking-[0.2em] group"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#d3ff4a] to-[#8bc4b1] flex flex-shrink-0 items-center justify-center shadow-inner">
          <Sparkles className="w-4 h-4 text-[#0b1411]" />
        </div>
        <span>AI Copilot</span>
        {suggestions.length > 0 && (
          <span className="ml-1 px-2.5 py-1 bg-[#f2f4f2] text-[#0b1411] rounded-full text-[10px] font-black leading-none">
            {suggestions.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-[200] bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden transition-all ${
        isMinimized ? 'w-80' : 'w-96'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-[1rem] bg-[#f2f4f2] border border-gray-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#0b1411]" />
          </div>
          <div>
            <h3 className="font-black text-[10px] uppercase tracking-widest text-[#1d2321]">
              AI Copilot
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-3 text-gray-400 hover:text-[#0b1411] hover:bg-[#f2f4f2] rounded-2xl transition-all shadow-sm"
          >
            {isMinimized ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-3 text-gray-400 hover:text-[#0b1411] hover:bg-[#f2f4f2] rounded-2xl transition-all shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="max-h-[500px] overflow-y-auto bg-[#fcfdfc]">
          {analyzing ? (
            <div className="p-10 text-center flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#8bc4b1] mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-[#0b1411]">Analyzing your page...</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-2">This will take a few seconds</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-[#f2f4f2] border border-gray-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Zap className="w-8 h-8 text-[#d3ff4a]" />
              </div>
              <h4 className="font-black text-sm uppercase tracking-widest text-[#0b1411] mb-2">Looking Great!</h4>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6 leading-relaxed">
                Your page is well-structured. Keep building!
              </p>
              <button
                onClick={analyzePage}
                disabled={analyzing}
                className="px-6 py-3 bg-[#1d2321] text-white rounded-full hover:bg-black transition-all text-[10px] font-black uppercase tracking-widest shadow-lg"
              >
                Re-analyze Page
              </button>
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-5 rounded-[1.5rem] bg-white border border-gray-100 transition-all hover:border-[#8bc4b1] hover:shadow-md group`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 shrink-0 opacity-80">{getPriorityIcon(suggestion.priority)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-[#0b1411] mb-2">
                        {suggestion.title}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-bold leading-relaxed mb-4">
                        {suggestion.description}
                      </p>
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        disabled={loading}
                        className="w-full px-4 py-3 bg-[#f2f4f2] text-[#0b1411] hover:text-[#0b1411] rounded-[1rem] hover:bg-[#d3ff4a] transition-all text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:shadow-[0_0_20px_rgba(211,255,74,0.3)] shadow-sm border border-transparent hover:border-[#c0eb3f] group-hover:bg-[#fcfdfc]"
                      >
                        {loading ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Applying...
                          </span>
                        ) : (
                          'Apply Suggestion'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      {!isMinimized && !analyzing && suggestions.length > 0 && (
        <div className="p-4 border-t border-gray-100 bg-white">
          <button
            onClick={analyzePage}
            disabled={analyzing}
            className="w-full px-4 py-3 bg-white border border-gray-100 text-[#0b1411] text-[10px] font-black uppercase tracking-[0.2em] rounded-[1rem] hover:border-[#8bc4b1] hover:text-[#8bc4b1] transition-all shadow-sm active:scale-[0.98]"
          >
            Re-analyze Page
          </button>
        </div>
      )}
    </div>
  );
}
