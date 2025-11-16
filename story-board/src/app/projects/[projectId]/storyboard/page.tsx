'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  Plus,
  Grid,
  List,
  Sparkles,
  Download,
  Upload,
  Settings,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Maximize,
  Edit3,
  Trash2,
  Copy,
  Move,
  Palette,
  Camera,
  Mic,
  Users,
  MapPin,
  Clock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/hooks/useProjects';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

interface StoryboardPanel {
  id: string;
  panelNumber: number;
  image?: string;
  imageSource?: {
    type: 'ai-generated' | 'uploaded' | 'manual';
    provider?: string;
    prompt?: string;
    style?: string;
    generatedAt?: string;
  };
  description: string;
  shotType: 'wide-shot' | 'medium-shot' | 'close-up' | 'extreme-close-up' | 'over-shoulder' | 'pov' | 'establishing' | 'insert';
  cameraMovement: 'static' | 'pan' | 'tilt' | 'zoom' | 'dolly' | 'crane' | 'handheld' | 'steadicam';
  angle: 'eye-level' | 'high-angle' | 'low-angle' | 'bird-eye' | 'worm-eye';
  duration?: number;
  notes?: string;
  characters?: string[];
  props?: string[];
}

interface Scene {
  id: string;
  sceneNumber: number;
  title: string;
  location: {
    name: string;
    type: 'INT' | 'EXT';
    timeOfDay: 'DAY' | 'NIGHT' | 'DAWN' | 'DUSK';
  };
  description: string;
  storyboard: {
    panels: StoryboardPanel[];
    totalPanels: number;
  };
}

const StoryboardPage = () => {
  useRequireAuth();
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, isLoading } = useCurrentProject(projectId);

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiProvider, setAiProvider] = useState<'openai' | 'stability' | 'replicate'>('stability');
  const [aiStyle, setAiStyle] = useState<'realistic-sketch' | 'cartoon-sketch' | 'detailed-realistic' | 'minimalist' | 'dramatic'>('realistic-sketch');
  const [aiMood, setAiMood] = useState<'neutral' | 'dramatic' | 'bright' | 'dark' | 'vintage'>('neutral');
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showAddScene, setShowAddScene] = useState(false);
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [newSceneDescription, setNewSceneDescription] = useState('');
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [editingPanel, setEditingPanel] = useState<StoryboardPanel | null>(null);

  // Load user's actual storyboard data
  useEffect(() => {
    const loadStoryboardData = async () => {
      if (project) {
        try {
          const { storyboardApi } = await import('@/lib/api/storyboard');
          const result = await storyboardApi.getScenes(projectId);
          
          if (result.success && result.data) {
            // Convert backend scenes to frontend format
            const convertedScenes: Scene[] = result.data.map((backendScene: any) => ({
              id: backendScene._id,
              sceneNumber: backendScene.sceneNumber,
              title: backendScene.title,
              description: backendScene.description,
              location: {
                name: backendScene.location || 'Location',
                type: backendScene.interior ? 'INT' : 'EXT',
                timeOfDay: backendScene.timeOfDay?.toUpperCase() as 'DAY' | 'NIGHT' | 'DAWN' | 'DUSK' || 'DAY',
              },
              storyboard: {
                panels: backendScene.panels?.map((panel: any) => ({
                  id: panel._id,
                  panelNumber: panel.panelNumber,
                  image: panel.imageUrl,
                  imageSource: panel.imageSource,
                  description: panel.description,
                  shotType: panel.shotType || 'medium-shot',
                  cameraMovement: panel.cameraAngle || 'static',
                  angle: 'eye-level',
                  duration: panel.duration,
                  notes: panel.notes,
                })) || [],
                totalPanels: backendScene.panels?.length || 0,
              },
            }));
            
            setScenes(convertedScenes);
            
            // Select first scene if available
            if (convertedScenes.length > 0) {
              setSelectedSceneId(convertedScenes[0].id);
            }
          } else {
            // No scenes yet, start with empty array
            setScenes([]);
          }
        } catch (error) {
          console.error('Error loading storyboard data:', error);
          // Start with empty state if API fails
          setScenes([]);
        }
      }
    };

    loadStoryboardData();
  }, [project, projectId]);

  const selectedScene = scenes.find(scene => scene.id === selectedSceneId);
  const selectedPanel = selectedScene?.storyboard.panels.find(panel => panel.id === selectedPanelId);

  const handleAddPanel = async () => {
    if (!selectedScene) {
      toast.error('Please select a scene first');
      return;
    }

    try {
      // Validate that we have proper MongoDB ObjectIds
      if (!selectedScene.id.match(/^[0-9a-fA-F]{24}$/)) {
        toast.error('Invalid scene ID format. Please recreate the scene using the "Add Scene" button.');
        return;
      }

      const { storyboardApi } = await import('@/lib/api/storyboard');
      
      const panelData = {
        panelNumber: selectedScene.storyboard.panels.length + 1,
        description: 'New panel description',
        shotType: 'medium-shot',
        cameraAngle: 'static',
      };

      console.log('Creating panel with data:', { projectId, sceneId: selectedScene.id, panelData });
      
      const result = await storyboardApi.createPanel(projectId, selectedScene.id, panelData);
      
      if (result.success && result.data) {
        const newPanel: StoryboardPanel = {
          id: result.data._id,
          panelNumber: result.data.panelNumber,
          image: result.data.imageUrl,
          description: result.data.description,
          shotType: 'wide-shot',
          cameraMovement: 'static',
          angle: 'eye-level',
          duration: result.data.duration,
          notes: result.data.notes,
        };

        setScenes(scenes.map(scene => 
          scene.id === selectedSceneId
            ? {
                ...scene,
                storyboard: {
                  panels: [...scene.storyboard.panels, newPanel],
                  totalPanels: scene.storyboard.totalPanels + 1,
                },
              }
            : scene
        ));

        setSelectedPanelId(newPanel.id);
        toast.success('Panel added successfully!');
      } else {
        throw new Error(result.message || 'Failed to create panel');
      }
    } catch (error: any) {
      console.error('Panel creation error:', error);
      
      if (error.response?.status === 404) {
        toast.error('API route not found. Please ensure the backend server is running.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
      } else {
        toast.error(`Failed to create panel: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleOpenAIDialog = (panel: StoryboardPanel) => {
    setSelectedPanelId(panel.id);
    
    // Auto-generate a basic prompt based on panel context
    const sceneContext = selectedScene ? `In ${selectedScene.title}: ` : '';
    const shotDescription = `${panel.shotType.replace('-', ' ')} showing `;
    const cameraInfo = panel.cameraMovement !== 'static' ? ` with ${panel.cameraMovement} camera movement` : '';
    
    const basePrompt = `${sceneContext}${shotDescription}${panel.description}${cameraInfo}`;
    setAiPrompt(basePrompt);
    setShowAIDialog(true);
  };

  const handleGenerateAIImage = async () => {
    if (!aiPrompt.trim() || !selectedPanel || !selectedScene) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStep('Initializing AI generation...');

    try {
      // Progress simulation for better UX
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 20;
        });
      }, 500);

      setGenerationStep('Enhancing prompt for storyboard style...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      setGenerationStep('Generating image with AI...');
      
      // Call the actual API
      const { storyboardApi } = await import('@/lib/api/storyboard');
      
      const generateRequest = {
        sceneId: selectedScene.id,
        panelId: selectedPanel.id,
        prompt: aiPrompt,
        provider: aiProvider,
        style: aiStyle,
        mood: aiMood,
        enhancePrompt: enhancePrompt,
        shotType: selectedPanel.shotType,
        cameraMovement: selectedPanel.cameraMovement,
        aspectRatio: '16:9'
      };

      // Validate that we have proper MongoDB ObjectIds
      if (!selectedScene.id.match(/^[0-9a-fA-F]{24}$/) || !selectedPanel.id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new Error('Please create scenes and panels through the proper workflow. Legacy local data detected.');
      }

      const result = await storyboardApi.generateImage(generateRequest);

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setGenerationStep('Generation completed!');

      if (result.success && result.data?.imageUrl) {
        // Update panel with new image
        setScenes(scenes.map(scene => 
          scene.id === selectedSceneId
            ? {
                ...scene,
                storyboard: {
                  ...scene.storyboard,
                  panels: scene.storyboard.panels.map(panel =>
                    panel.id === selectedPanel.id 
                      ? { 
                          ...panel, 
                          image: result.data.imageUrl,
                          imageSource: {
                            type: 'ai-generated',
                            provider: aiProvider,
                            prompt: aiPrompt,
                            style: aiStyle,
                            generatedAt: new Date().toISOString()
                          }
                        }
                      : panel
                  ),
                },
              }
            : scene
        ));

        setShowAIDialog(false);
        setAiPrompt('');
        setGenerationProgress(0);
        setGenerationStep('');
        toast.success(`AI image generated successfully with ${aiProvider}!`);
      } else {
        throw new Error(result.message || 'Generation failed');
      }
    } catch (error: any) {
      console.error('AI Generation Error:', error);
      setGenerationStep('Generation failed');
      toast.error(`Failed to generate AI image: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => {
        setGenerationProgress(0);
        setGenerationStep('');
      }, 2000);
    }
  };

  const handleEditPanel = (panel: StoryboardPanel) => {
    setEditingPanel({ ...panel });
    setShowEditPanel(true);
  };

  const handleSavePanel = () => {
    if (!editingPanel || !selectedScene) return;

    setScenes(scenes.map(scene => 
      scene.id === selectedSceneId
        ? {
            ...scene,
            storyboard: {
              ...scene.storyboard,
              panels: scene.storyboard.panels.map(panel =>
                panel.id === editingPanel.id ? editingPanel : panel
              ),
            },
          }
        : scene
    ));

    setShowEditPanel(false);
    setEditingPanel(null);
    toast.success('Panel updated successfully!');
  };

  const handleAddScene = async () => {
    if (!newSceneTitle.trim()) {
      toast.error('Please enter a scene title');
      return;
    }

    try {
      const { storyboardApi } = await import('@/lib/api/storyboard');
      
      const sceneData = {
        sceneNumber: scenes.length + 1,
        title: newSceneTitle,
        description: newSceneDescription,
        location: 'New Location',
        timeOfDay: 'morning' as const,
        interior: true,
      };

      const result = await storyboardApi.createScene(projectId, sceneData);
      
      if (result.success && result.data) {
        // Convert backend scene format to frontend format
        const newScene: Scene = {
          id: result.data._id,
          sceneNumber: result.data.sceneNumber,
          title: result.data.title,
          description: result.data.description,
          location: {
            name: result.data.location || 'New Location',
            type: result.data.interior ? 'INT' : 'EXT',
            timeOfDay: result.data.timeOfDay?.toUpperCase() as 'DAY' | 'NIGHT' | 'DAWN' | 'DUSK' || 'DAY',
          },
          storyboard: {
            panels: result.data.panels?.map((panel: any) => ({
              id: panel._id,
              panelNumber: panel.panelNumber,
              image: panel.imageUrl,
              description: panel.description,
              shotType: panel.shotType || 'medium-shot',
              cameraMovement: panel.cameraAngle || 'static',
              angle: 'eye-level',
              duration: panel.duration,
              notes: panel.notes,
            })) || [],
            totalPanels: result.data.panels?.length || 0,
          },
        };

        setScenes([...scenes, newScene]);
        setSelectedSceneId(newScene.id);
        setShowAddScene(false);
        setNewSceneTitle('');
        setNewSceneDescription('');
        toast.success('New scene added successfully!');
      } else {
        throw new Error(result.message || 'Failed to create scene');
      }
    } catch (error: any) {
      console.error('Scene creation error:', error);
      toast.error(`Failed to create scene: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Storyboard Editor</h1>
              <p className="text-gray-600">{project?.title}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  leftIcon={<Grid className="w-4 h-4" />}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                  leftIcon={<List className="w-4 h-4" />}
                >
                  Timeline
                </Button>
              </div>
              
              <Button
                variant="outline"
                leftIcon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? 'Pause' : 'Preview'}
              </Button>
              
              <Button
                variant="success"
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Scene List Sidebar */}
          <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Scenes</h3>
                <Button 
                  size="sm" 
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowAddScene(true)}
                >
                  Add Scene
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {scenes.map((scene) => (
                <motion.div
                  key={scene.id}
                  whileHover={{ x: 4 }}
                  className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                    selectedSceneId === scene.id ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-white'
                  }`}
                  onClick={() => setSelectedSceneId(scene.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        Scene {scene.sceneNumber}: {scene.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {scene.location.type} - {scene.location.name} - {scene.location.timeOfDay}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {scene.storyboard.totalPanels} panels
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Main Storyboard Area */}
          <div className="flex-1 flex flex-col">
            {selectedScene ? (
              <>
                {/* Scene Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Scene {selectedScene.sceneNumber}: {selectedScene.title}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {selectedScene.location.type} - {selectedScene.location.name} - {selectedScene.location.timeOfDay}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        leftIcon={<Sparkles className="w-4 h-4" />}
                        variant="outline"
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        onClick={() => {
                          if (selectedScene && selectedScene.storyboard.panels.length > 0) {
                            handleOpenAIDialog(selectedScene.storyboard.panels[0]);
                          }
                        }}
                        disabled={!selectedScene || selectedScene.storyboard.panels.length === 0}
                      >
                        AI Generate
                      </Button>
                      <Button
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={handleAddPanel}
                      >
                        Add Panel
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Storyboard Panels */}
                <div className="flex-1 overflow-y-auto p-6">
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {selectedScene.storyboard.panels.map((panel) => (
                        <motion.div
                          key={panel.id}
                          whileHover={{ scale: 1.02 }}
                          className={`bg-white rounded-xl border-2 transition-all cursor-pointer ${
                            selectedPanelId === panel.id
                              ? 'border-indigo-500 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                          }`}
                          onClick={() => setSelectedPanelId(panel.id)}
                        >
                          <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-700">
                                Panel {panel.panelNumber}
                              </span>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenAIDialog(panel);
                                  }}
                                  className="hover:bg-purple-50 hover:text-purple-600"
                                >
                                  <Sparkles className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon-sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditPanel(panel);
                                  }}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Panel Image */}
                            <div className="aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center relative">
                              {panel.image ? (
                                <>
                                  <img
                                    src={panel.image}
                                    alt={`Panel ${panel.panelNumber}`}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                  {/* AI Generated Badge */}
                                  {panel.imageSource?.type === 'ai-generated' && (
                                    <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                      <Sparkles className="w-3 h-3" />
                                      AI
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="text-center">
                                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-xs text-gray-500">No image</p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-purple-600 hover:text-purple-700 mt-2"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenAIDialog(panel);
                                    }}
                                  >
                                    <Sparkles className="w-3 h-3 mr-1" />
                                    Generate
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {/* Panel Info */}
                            <div className="space-y-2">
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {panel.description}
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                  {panel.shotType.replace('-', ' ')}
                                </span>
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                  {panel.cameraMovement}
                                </span>
                                {panel.duration && (
                                  <span className="bg-gray-100 px-2 py-1 rounded">
                                    {panel.duration}s
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedScene.storyboard.panels.map((panel, index) => (
                        <motion.div
                          key={panel.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`bg-white rounded-xl border-2 p-6 transition-all cursor-pointer ${
                            selectedPanelId === panel.id
                              ? 'border-indigo-500 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedPanelId(panel.id)}
                        >
                          <div className="flex gap-6">
                            <div className="w-48 aspect-video bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              {panel.image ? (
                                <img
                                  src={panel.image}
                                  alt={`Panel ${panel.panelNumber}`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="text-center">
                                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                  <p className="text-xs text-gray-500">No image</p>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-900">
                                  Panel {panel.panelNumber}
                                </h4>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<Sparkles className="w-4 h-4" />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedPanelId(panel.id);
                                      setShowAIDialog(true);
                                    }}
                                  >
                                    Generate AI
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    leftIcon={<Edit3 className="w-4 h-4" />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditPanel(panel);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                </div>
                              </div>
                              
                              <p className="text-gray-700 mb-4">{panel.description}</p>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Shot Type:</span>
                                  <p className="font-medium">{panel.shotType.replace('-', ' ')}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Movement:</span>
                                  <p className="font-medium">{panel.cameraMovement}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Angle:</span>
                                  <p className="font-medium">{panel.angle.replace('-', ' ')}</p>
                                </div>
                                {panel.duration && (
                                  <div>
                                    <span className="text-gray-500">Duration:</span>
                                    <p className="font-medium">{panel.duration}s</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Grid className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Scene</h3>
                  <p className="text-gray-600">Choose a scene from the sidebar to start storyboarding</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Generation Dialog */}
      <AnimatePresence>
        {showAIDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAIDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Image Generation</h3>
                  <p className="text-sm text-gray-600">Panel {selectedPanel?.panelNumber}</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe the scene
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="A wide shot of a bustling coffee shop with warm lighting, customers sitting at tables, barista working behind counter..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAIDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  loading={isGenerating}
                  onClick={handleGenerateAIImage}
                  disabled={!aiPrompt.trim()}
                >
                  {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Scene Modal */}
      <AnimatePresence>
        {showAddScene && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add New Scene</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddScene(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scene Title *
                  </label>
                  <Input
                    placeholder="e.g., Opening Scene, Chase Sequence"
                    value={newSceneTitle}
                    onChange={(e) => setNewSceneTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Brief description of what happens in this scene"
                    value={newSceneDescription}
                    onChange={(e) => setNewSceneDescription(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowAddScene(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddScene}
                  disabled={!newSceneTitle.trim()}
                >
                  Add Scene
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Panel Modal */}
      <AnimatePresence>
        {showEditPanel && editingPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Panel {editingPanel.panelNumber}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowEditPanel(false);
                    setEditingPanel(null);
                  }}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Describe what happens in this panel"
                    value={editingPanel.description}
                    onChange={(e) => setEditingPanel({
                      ...editingPanel,
                      description: e.target.value
                    })}
                  />
                </div>

                {/* Shot Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shot Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingPanel.shotType}
                    onChange={(e) => setEditingPanel({
                      ...editingPanel,
                      shotType: e.target.value as StoryboardPanel['shotType']
                    })}
                  >
                    <option value="wide-shot">Wide Shot</option>
                    <option value="medium-shot">Medium Shot</option>
                    <option value="close-up">Close-up</option>
                    <option value="extreme-close-up">Extreme Close-up</option>
                    <option value="over-shoulder">Over Shoulder</option>
                    <option value="pov">POV (Point of View)</option>
                    <option value="establishing">Establishing Shot</option>
                    <option value="insert">Insert Shot</option>
                  </select>
                </div>

                {/* Camera Movement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camera Movement
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingPanel.cameraMovement}
                    onChange={(e) => setEditingPanel({
                      ...editingPanel,
                      cameraMovement: e.target.value as StoryboardPanel['cameraMovement']
                    })}
                  >
                    <option value="static">Static</option>
                    <option value="pan">Pan</option>
                    <option value="tilt">Tilt</option>
                    <option value="zoom">Zoom</option>
                    <option value="dolly">Dolly</option>
                    <option value="crane">Crane</option>
                    <option value="handheld">Handheld</option>
                    <option value="steadicam">Steadicam</option>
                  </select>
                </div>

                {/* Camera Angle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Camera Angle
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={editingPanel.angle}
                    onChange={(e) => setEditingPanel({
                      ...editingPanel,
                      angle: e.target.value as StoryboardPanel['angle']
                    })}
                  >
                    <option value="eye-level">Eye Level</option>
                    <option value="high-angle">High Angle</option>
                    <option value="low-angle">Low Angle</option>
                    <option value="bird-eye">Bird's Eye View</option>
                    <option value="worm-eye">Worm's Eye View</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (seconds)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g., 5"
                    value={editingPanel.duration || ''}
                    onChange={(e) => setEditingPanel({
                      ...editingPanel,
                      duration: e.target.value ? Number(e.target.value) : undefined
                    })}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Additional notes about this panel"
                    value={editingPanel.notes || ''}
                    onChange={(e) => setEditingPanel({
                      ...editingPanel,
                      notes: e.target.value
                    })}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditPanel(false);
                    setEditingPanel(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePanel}
                  disabled={!editingPanel.description.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Image Generation Modal */}
      <AnimatePresence>
        {showAIDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={() => !isGenerating && setShowAIDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Generate AI Storyboard Image
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  Generate a professional storyboard image for Panel {selectedPanel?.panelNumber} using AI
                </p>
              </div>

              <div className="p-6 space-y-6">
                {/* Generation Progress */}
                {isGenerating && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-sm font-medium text-blue-900">
                        {generationStep}
                      </span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <div className="text-xs text-blue-700 mt-1 text-right">
                      {Math.round(generationProgress)}%
                    </div>
                  </div>
                )}

                {/* Prompt Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe the scene *
                  </label>
                  <textarea
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                    rows={3}
                    placeholder="e.g., A detective examining clues in a dimly lit office, dramatic lighting through venetian blinds"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={isGenerating}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Tip: Be specific about lighting, mood, and key visual elements
                  </div>
                </div>

                {/* AI Provider Selection */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      AI Provider
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={aiProvider}
                      onChange={(e) => setAiProvider(e.target.value as any)}
                      disabled={isGenerating}
                    >
                      <option value="openai">OpenAI DALL-E</option>
                      <option value="stability">Stability AI</option>
                      <option value="replicate">Replicate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Style
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={aiStyle}
                      onChange={(e) => setAiStyle(e.target.value as any)}
                      disabled={isGenerating}
                    >
                      <option value="realistic-sketch">Realistic Sketch</option>
                      <option value="cartoon-sketch">Cartoon Sketch</option>
                      <option value="detailed-realistic">Detailed Realistic</option>
                      <option value="minimalist">Minimalist</option>
                      <option value="dramatic">Dramatic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mood
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      value={aiMood}
                      onChange={(e) => setAiMood(e.target.value as any)}
                      disabled={isGenerating}
                    >
                      <option value="neutral">Neutral</option>
                      <option value="dramatic">Dramatic</option>
                      <option value="bright">Bright</option>
                      <option value="dark">Dark</option>
                      <option value="vintage">Vintage</option>
                    </select>
                  </div>
                </div>

                {/* Advanced Options Toggle */}
                <div>
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    disabled={isGenerating}
                  >
                    <Settings className="w-4 h-4" />
                    Advanced Options
                    <motion.div
                      animate={{ rotate: showAdvancedOptions ? 180 : 0 }}
                      className="text-gray-400"
                    >
                      ▼
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {showAdvancedOptions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <label className="text-sm font-medium text-gray-700">
                              Enhance Prompt
                            </label>
                            <p className="text-xs text-gray-500">
                              Automatically enhance your prompt with cinematic details
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={enhancePrompt}
                              onChange={(e) => setEnhancePrompt(e.target.checked)}
                              disabled={isGenerating}
                            />
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              enhancePrompt ? 'bg-purple-600' : 'bg-gray-300'
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                                enhancePrompt ? 'translate-x-5' : 'translate-x-0'
                              } mt-0.5 ml-0.5`} />
                            </div>
                          </label>
                        </div>

                        {/* Panel Context Information */}
                        {selectedPanel && (
                          <div className="bg-white border border-gray-200 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Panel Context</h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="text-gray-500">Shot Type:</span>
                                <span className="ml-2 font-medium">{selectedPanel.shotType}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Camera Movement:</span>
                                <span className="ml-2 font-medium">{selectedPanel.cameraMovement}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Angle:</span>
                                <span className="ml-2 font-medium">{selectedPanel.angle}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Scene:</span>
                                <span className="ml-2 font-medium">{selectedScene?.title}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
                <div className="text-xs text-gray-500">
                  {aiProvider === 'openai' && 'High quality, natural images'}
                  {aiProvider === 'stability' && 'Artistic and creative styles'}
                  {aiProvider === 'replicate' && 'Advanced AI models'}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowAIDialog(false)}
                    disabled={isGenerating}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleGenerateAIImage}
                    disabled={!aiPrompt.trim() || isGenerating}
                    leftIcon={isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Image'}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default StoryboardPage;
