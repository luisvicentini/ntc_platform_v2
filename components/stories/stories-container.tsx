"use client"

import { useState, useEffect } from "react"
import { StoryCircle } from "./story-circle"
import { StoryCreateButton } from "./story-create-button"
import { StoryViewer, Story } from "./story-viewer"
import { useAuth } from "@/contexts/auth-context"
import { CreateStoryModal } from "./create-story-modal"
import { BookOpenCheckIcon } from "lucide-react"

interface StoriesContainerProps {
  stories: Story[]
  isContentProducer?: boolean
  onReloadStories?: () => Promise<void>
}

export function StoriesContainer({ 
  stories: initialStories, 
  isContentProducer = false,
  onReloadStories 
}: StoriesContainerProps) {
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewedStories, setViewedStories] = useState<Record<string, boolean>>({})
  const [stories, setStories] = useState<Story[]>(initialStories)
  const { user } = useAuth()
  
  // Atualizar stories quando as props mudarem
  useEffect(() => {
    setStories(initialStories);
  }, [initialStories]);
  
  // Listener para atualizar reações quando o evento for disparado
  useEffect(() => {
    const handleReactionUpdated = (event: Event) => {
      const { storyId, reactions } = (event as CustomEvent).detail;
      
      // Atualizar o story com as contagens de reações atualizadas
      setStories(prevStories => 
        prevStories.map(story => 
          story.id === storyId 
            ? { ...story, reactions: reactions }
            : story
        )
      );
    };
    
    // Adicionar listener para o evento
    window.addEventListener('storyReactionUpdated', handleReactionUpdated);
    
    // Cleanup: remover listener quando o componente for desmontado
    return () => {
      window.removeEventListener('storyReactionUpdated', handleReactionUpdated);
    };
  }, []);
  
  // Função para determinar se um usuário já viu um story
  const hasSeenStory = (storyId: string) => {
    return viewedStories[storyId] || false
  }
  
  // Marcar story como visto ao exibi-lo
  useEffect(() => {
    if (selectedStoryIndex !== null && stories[selectedStoryIndex]) {
      const storyId = stories[selectedStoryIndex].id
      setViewedStories(prev => ({ ...prev, [storyId]: true }))
      
      // Salvar no localStorage
      try {
        const saved = JSON.parse(localStorage.getItem('viewedStories') || '{}')
        saved[storyId] = true
        localStorage.setItem('viewedStories', JSON.stringify(saved))
      } catch (e) {
        console.error('Erro ao salvar stories vistos:', e)
      }
    }
  }, [selectedStoryIndex, stories])
  
  // Carregar stories já vistos do localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('viewedStories') || '{}')
      setViewedStories(saved)
    } catch (e) {
      console.error('Erro ao carregar stories vistos:', e)
    }
  }, [])
  
  // Abrir story ao clicar
  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index)
  }
  
  // Fechar visualizador
  const handleCloseViewer = () => {
    setSelectedStoryIndex(null)
  }
  
  // Abrir modal de criação
  const handleCreateClick = () => {
    setShowCreateModal(true)
  }
  
  // Handler para quando um story é publicado com sucesso
  const handleStoryCreated = async () => {
    if (onReloadStories) {
      await onReloadStories()
    }
  }
  
  // Handler para quando um story é removido
  const handleStoryRemoved = (storyId: string) => {
    // Verificar qual era o índice do story que foi removido
    const removedIndex = stories.findIndex(story => story.id === storyId);
    
    // Remover story da lista local
    setStories(prevStories => prevStories.filter(story => story.id !== storyId));
    
    // Se o story removido é o que está sendo visualizado, fechar o visualizador
    // ou navegar para o próximo disponível
    if (selectedStoryIndex !== null) {
      // Se era o último story ou único story, fechar o viewer
      if (stories.length <= 1 || removedIndex >= stories.length - 1) {
        setSelectedStoryIndex(null);
      } 
      // Se removeu um story anterior ao atual, ajustar o índice para manter o story atual visível
      else if (removedIndex < selectedStoryIndex) {
        setSelectedStoryIndex(selectedStoryIndex - 1);
      }
      // Caso contrário, mantém o mesmo índice (que agora aponta para o próximo story)
    }
    
    // Recarregar a lista de stories do servidor, se disponível
    if (onReloadStories) {
      onReloadStories();
    }
  }
  
  return (
    <>
      <div className="flex items-center gap-4 overflow-x-auto py-4 px-2 no-scrollbar border-b border-zinc-100 pb-5">
        {/* Botão de criação de story (apenas para produtores de conteúdo) */}
        {isContentProducer && (
          <StoryCreateButton onClick={handleCreateClick} />
        )}
        
        {/* Lista de stories */}
        {stories.length > 0 ? (
          stories.map((story, index) => (
            <StoryCircle
              key={story.id}
              id={story.id}
              userId={story.userId}
              userName={story.userName}
              userAvatar={story.userAvatar}
              thumbnail={story.mediaUrl}
              mediaType={story.mediaType}
              hasSeen={hasSeenStory(story.id)}
              onClick={() => handleStoryClick(index)}
            />
          ))
        ) : (
          !isContentProducer && (
            <div className="flex items-center justify-center flex-col px-6 py-4 text-zinc-400">
              <BookOpenCheckIcon className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhum story disponível</p>
            </div>
          )
        )}
      </div>
      
      {/* Visualizador de stories */}
      {selectedStoryIndex !== null && (
        <StoryViewer
          stories={stories}
          initialStoryIndex={selectedStoryIndex}
          onClose={handleCloseViewer}
          onRemoveStory={handleStoryRemoved}
        />
      )}
      
      {/* Modal de criação de story */}
      {showCreateModal && (
        <CreateStoryModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleStoryCreated}
        />
      )}
      
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  )
} 