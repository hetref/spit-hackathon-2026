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
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all font-bold text-sm uppercase tracking-wider group"
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span>AI Copilot</span>
        {suggestions.length > 0 && (
          <span className="ml-1 px-2 py-0.5 bg-white text-purple-600 rounded-full text-xs font-black">
            {suggestions.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-2xl border-2 border-purple-200 transition-all ${
        isMinimized ? 'w-80' : 'w-96'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-tight text-gray-900">
              AI Copilot
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            {isMinimized ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="max-h-[500px] overflow-y-auto">
          {analyzing ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-700">Analyzing your page...</p>
              <p className="text-xs text-gray-500 mt-1">This will take a few seconds</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-black text-gray-900 mb-2">Looking Great!</h4>
              <p className="text-sm text-gray-600 mb-4">
                Your page is well-structured. Keep building!
              </p>
              <button
                onClick={analyzePage}
                disabled={analyzing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-bold"
              >
                Re-analyze Page
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`p-4 rounded-xl border-2 ${getPriorityColor(
                    suggestion.priority
                  )} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getPriorityIcon(suggestion.priority)}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 mb-1">
                        {suggestion.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
                        {suggestion.description}
                      </p>
                      <button
                        onClick={() => applySuggestion(suggestion)}
                        disabled={loading}
                        className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="p-3 border-t border-gray-100 bg-gray-50">
          <button
            onClick={analyzePage}
            disabled={analyzing}
            className="w-full px-3 py-2 text-xs font-bold text-purple-600 hover:bg-purple-50 rounded-lg transition-colors uppercase tracking-wider"
          >
            Re-analyze Page
          </button>
        </div>
      )}
    </div>
  );
}
