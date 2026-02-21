'use client'
// Force recompile to inject imports
import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Search,
  FolderOpen
} from 'lucide-react'
import { Toaster, toast } from 'sonner'

export default function MediaLibraryPage() {
  const router = useRouter()
  const params = useParams()

  // Empty state for pure UI scaffolding
  const [images, setImages] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef(null)

  // Initialize and fetch media from database
  useEffect(() => {
    const fetchMedia = async () => {
      try {
        const res = await fetch(`/api/tenants/${params.tenantId}/media`)
        const data = await res.json()
        if (data.success && data.media) {
          const formattedMedia = data.media.map(m => ({
            id: m.id,
            url: m.url,
            originalKey: m.originalKey,
            name: m.name,
            date: new Date(m.createdAt).toLocaleDateString()
          }))
          setImages(formattedMedia)
        }
      } catch (err) {
        console.error("Failed to fetch media", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMedia()
  }, [params.tenantId])
  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`/api/tenants/${params.tenantId}/media`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.success && data.media) {
        const newImage = {
          id: data.media.id,
          url: data.media.url,
          originalKey: data.media.originalKey,
          name: data.media.name,
          date: new Date(data.media.createdAt).toLocaleDateString()
        }

        const nextState = [newImage, ...images]
        setImages(nextState)
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch (err) {
      alert('Error uploading file: ' + err.message)
    } finally {
      setIsUploading(false)
      // reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const triggerUpload = () => fileInputRef.current?.click()

  const filteredImages = images.filter(img =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#fcfdfc] font-sans text-gray-900 text-base pb-20 relative">
      <Toaster position="top-center" richColors />
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start sm:items-center gap-6">
              <button
                onClick={() => router.push(`/${params.tenantId}`)}
                className="mt-1 sm:mt-0 p-3 bg-white border border-gray-200 text-gray-400 hover:text-[#0b1411] hover:border-[#0b1411]/20 rounded-2xl transition-all shadow-sm hover:shadow-md focus:outline-none"
                title="Back to Overview"
              >
                <ArrowLeft className="h-6 w-6" />
              </button>
              <div>
                <p className="text-[#8bc4b1] text-[10px] font-bold tracking-[0.2em] uppercase mb-1">
                  WORKSPACE DIRECTORY
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-[#1d2321] uppercase tracking-tighter leading-tight">
                  Media Library
                </h1>
                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 block">Manage your uploaded assets</span>
              </div>
            </div>

            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
            />
            <button
              onClick={triggerUpload}
              disabled={isUploading}
              className="w-full sm:w-auto bg-[#d3ff4a] text-[#0b1411] h-14 px-8 rounded-full font-bold flex items-center justify-center hover:bg-[#c0eb3f] transition-all active:scale-95 shadow-[0_0_20px_rgba(211,255,74,0.3)] hover:scale-105 duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">Uploading...</span>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Upload Image
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-12 space-y-10">

        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 block w-full px-5 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-[#0b1411] font-bold placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b1411]/20 transition-all text-sm shadow-sm hover:border-[#8bc4b1]"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:flex">
            {isLoading ? (
              <div className="h-3 w-24 bg-gray-100 rounded-full animate-pulse" />
            ) : (
              <>{filteredImages.length} {filteredImages.length === 1 ? 'Asset' : 'Assets'} Found</>
            )}
          </div>
        </div>

        {/* Media Grid / Empty State */}
        {isLoading ? (
          // Skeleton Loading State
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm animate-pulse"
              >
                <div className="aspect-square bg-gray-100" />
                <div className="p-4 bg-white border-t border-gray-50">
                  <div className="h-3 bg-gray-100 rounded-full w-3/4 mb-2" />
                  <div className="h-2 bg-gray-100 rounded-full w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="py-32 text-center border border-gray-200 rounded-[2.5rem] bg-[#fcfdfc] border-dashed px-6 flex flex-col items-center">
            <div className="h-24 w-24 rounded-[2.5rem] bg-gray-50 border border-gray-100 flex items-center justify-center mb-8 shadow-inner">
              <FolderOpen size={40} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-[#0b1411] tracking-tight mb-3">
              {searchQuery ? 'No Results Found' : 'No Media Uploaded'}
            </h3>
            <p className="text-base font-medium text-gray-500 max-w-sm mb-10 leading-relaxed">
              {searchQuery ? 'Try adjusting your search query.' : 'Drop images here to start building out your media library. Uploaded assets will be reusable across all your websites.'}
            </p>
            {!searchQuery && (
              <>
                <button
                  onClick={triggerUpload}
                  className="h-14 px-8 bg-[#0b1411] text-[#d3ff4a] font-bold rounded-full flex items-center justify-center hover:bg-[#1d2321] transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  <Upload size={20} className="mr-2" />
                  Select Files
                </button>
                <p className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Supported formats: PNG, JPG, JPEG, WEBP, SVG
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredImages.map((img) => (
              <div
                key={img.id}
                onClick={() => {
                  navigator.clipboard.writeText(img.url);
                  toast.success('URL copied to clipboard!');
                }}
                className="group relative bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  <img src={img.url} alt={img.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">Copy URL</span>
                  </div>
                </div>
                <div className="p-4 bg-white border-t border-gray-50 pointer-events-none">
                  <h4 className="text-xs font-bold text-gray-900 truncate" title={img.name}>{img.name}</h4>
                  <p className="text-[10px] font-medium text-gray-400 mt-0.5">{img.date}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
