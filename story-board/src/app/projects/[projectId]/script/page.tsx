'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface Character {
  id: string;
  name: string;
  role: string;
  scenes: number;
}

import { useParams } from 'next/navigation';
import {
  Plus,
  FileText,
  Search,
  Download,
  Save,
  Bold,
  Italic,
  Underline,
  Users,
  MapPin,
  Package,
  Shirt,
  Palette,
  Car,
  Zap,
  Star,
  AlertTriangle,
  CheckCircle,
  Grid3X3,
  List,
  Calendar,
  DollarSign,
  Hash,
  Type,
  Briefcase,
  Eye,
  Edit3,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/hooks/useProjects';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchScript, updateScript } from '@/lib/store/scriptSlice';

interface ScriptElement {
  id: string;
  type: 'cast' | 'location' | 'prop' | 'costume' | 'makeup' | 'vfx' | 'sfx' | 'vehicle' | 'animal' | 'weapon' | 'food' | 'set_dec' | 'special_equipment';
  name: string;
  description: string;
  category: string;
  scenes: string[];
  status: 'identified' | 'sourced' | 'confirmed' | 'on_set' | 'wrapped';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost?: number;
  actualCost?: number;
  supplier?: string;
  contact?: {
    name: string;
    phone?: string;
    email?: string;
  };
  notes?: string;
  images: string[];
  rentals: {
    isRental: boolean;
    startDate?: string;
    endDate?: string;
    dailyRate?: number;
    deposit?: number;
  };
  department: string;
  assignedTo?: string;
  lastUpdated: string;
}

interface Scene {
  number: string;
  title: string;
  location: string;
  timeOfDay: 'day' | 'night' | 'dawn' | 'dusk';
  pageCount: number;
  elements: string[]; // IDs of script elements
}

interface ScriptVersion {
  id: string;
  version: string;
  content: string;
  scenes: Scene[];
  characters: Character[];
  timestamp: string;
  isCurrent: boolean;
}

const ScriptBreakdownPage = () => {
  useRequireAuth();
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, isLoading } = useCurrentProject(projectId);

  // Redux hooks
  const dispatch = useAppDispatch();
  const { script, elements, isLoading: scriptLoading } = useAppSelector((state) => state.script);

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScene, setSelectedScene] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'breakdown' | 'elements' | 'scenes'>('breakdown');
  const [showAddElement, setShowAddElement] = useState(false);
  const [showAddCharacter, setShowAddCharacter] = useState(false);
  const [showAddScene, setShowAddScene] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [scriptContent, setScriptContent] = useState('');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterRole, setNewCharacterRole] = useState('');
  const [newSceneTitle, setNewSceneTitle] = useState('');
  const [newSceneLocation, setNewSceneLocation] = useState('');
  const [newSceneTimeOfDay, setNewSceneTimeOfDay] = useState<'day' | 'night' | 'dawn' | 'dusk'>('day');
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [viewingCharacter, setViewingCharacter] = useState<Character | null>(null);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [viewingScene, setViewingScene] = useState<Scene | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [versions, setVersions] = useState<ScriptVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<string>('1.0');

  // Fetch script data on component mount
  useEffect(() => {
    if (projectId) {
      dispatch(fetchScript(projectId)).then((result: any) => {
        if (result.payload?.data) {
          const data = result.payload.data;
          
          // Load versions from backend
          if (data.versions && Array.isArray(data.versions) && data.versions.length > 0) {
            console.log('Loading versions from backend:', data.versions);
            setVersions(data.versions);
            
            // Find current version
            const current = data.versions.find((v: ScriptVersion) => v.isCurrent);
            if (current) {
              setCurrentVersion(current.version);
              setScriptContent(current.content);
              setScenes(current.scenes);
              setCharacters(current.characters);
            } else {
              // Load latest version
              const latest = data.versions[data.versions.length - 1];
              setScriptContent(latest.content);
              setScenes(latest.scenes);
              setCharacters(latest.characters);
              setCurrentVersion(latest.version);
            }
          } else {
            // Fallback to old data structure
            if (data.content) {
              setScriptContent(data.content);
            }
            if (data.scenes && Array.isArray(data.scenes)) {
              setScenes(data.scenes);
            }
            if (data.characters && Array.isArray(data.characters)) {
              setCharacters(data.characters);
            }
          }
        }
      });
    }
  }, [projectId, dispatch]);

  const handleSaveScript = async () => {
    if (!projectId) return;

    try {
      const result = await dispatch(updateScript({
        projectId,
        scriptData: {
          content: scriptContent,
          scenes,
          characters
        }
      })).unwrap();
      
      console.log('Save result:', result);
      
      // Update versions from backend response
      if (result.data?.versions && result.data.versions.length > 0) {
        console.log('Versions from backend:', result.data.versions);
        setVersions(result.data.versions);
        
        // Find the current version
        const current = result.data.versions.find((v: ScriptVersion) => v.isCurrent);
        if (current) {
          setCurrentVersion(current.version);
        }
      }
      
      toast.success('Script saved successfully!');
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error || 'Failed to save script');
    }
  };

  const handleLoadVersion = async (version: ScriptVersion) => {
    setScriptContent(version.content);
    setScenes(version.scenes);
    setCharacters(version.characters);
    setCurrentVersion(version.version);
    
    toast.success(`Loaded version ${version.version}`);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) {
      toast.error('Please allow popups to export PDF');
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${project?.title || 'Script'}</title>
        <style>
          @page { margin: 1in; }
          body { 
            font-family: 'Courier New', monospace; 
            font-size: 12pt;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
          }
          h1 { 
            text-align: center; 
            font-size: 18pt;
            margin-bottom: 30px;
          }
          .content {
            white-space: pre-wrap;
          }
          .page-break { page-break-after: always; }
          .summary {
            margin-top: 40px;
            page-break-before: always;
          }
          .summary h2 {
            font-size: 14pt;
            margin-bottom: 15px;
          }
          .summary-item {
            margin: 8px 0;
            font-size: 10pt;
          }
        </style>
      </head>
      <body>
        <h1>${project?.title || 'UNTITLED SCRIPT'}</h1>
        <div class="content">${scriptContent || 'No content'}</div>
        
        ${scenes.length > 0 ? `
        <div class="summary">
          <h2>SCENE BREAKDOWN</h2>
          ${scenes.map(scene => `
            <div class="summary-item">
              <strong>Scene ${scene.number}:</strong> ${scene.title}<br/>
              <span style="margin-left: 20px;">Location: ${scene.location} - ${scene.timeOfDay.toUpperCase()}</span>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${characters.length > 0 ? `
        <div class="summary">
          <h2>CHARACTER LIST</h2>
          ${characters.map((char, idx) => `
            <div class="summary-item">
              ${idx + 1}. <strong>${char.name}</strong> - ${char.role}
            </div>
          `).join('')}
        </div>
        ` : ''}
      </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const formatText = (type: 'bold' | 'italic' | 'underline') => {
    // Text formatting logic would go here
    console.log(`Format text as ${type}`);
  };

  const insertElement = (element: 'scene' | 'character' | 'dialogue' | 'action') => {
    const insertText = {
      scene: '\n\nINT./EXT. LOCATION - TIME\n\n',
      character: '\nCHARACTER NAME\n',
      dialogue: '(dialogue)\n',
      action: 'Action description here.\n'
    };
    
    const newContent = scriptContent + insertText[element];
    setScriptContent(newContent);
  };

  const handleAddCharacter = () => {
    if (newCharacterName.trim() && newCharacterRole.trim()) {
      if (editingCharacter) {
        // Update existing character
        const updatedCharacters = characters.map(char =>
          char.id === editingCharacter.id
            ? { ...char, name: newCharacterName.trim(), role: newCharacterRole.trim() }
            : char
        );
        setCharacters(updatedCharacters);
        setEditingCharacter(null);
      } else {
        // Add new character
        const newCharacter: Character = {
          id: Date.now().toString(),
          name: newCharacterName.trim(),
          role: newCharacterRole.trim(),
          scenes: 0
        };
        setCharacters([...characters, newCharacter]);
      }
      setNewCharacterName('');
      setNewCharacterRole('');
      setShowAddCharacter(false);
    }
  };

  const handleAddScene = () => {
    if (newSceneTitle.trim() && newSceneLocation.trim()) {
      if (editingScene) {
        // Update existing scene
        const updatedScenes = scenes.map(scene =>
          scene.number === editingScene.number
            ? { 
                ...scene, 
                title: newSceneTitle.trim(), 
                location: newSceneLocation.trim(),
                timeOfDay: newSceneTimeOfDay
              }
            : scene
        );
        setScenes(updatedScenes);
        setEditingScene(null);
      } else {
        // Add new scene
        const sceneNumber = (scenes.length + 1).toString();
        const newScene: Scene = {
          number: sceneNumber,
          title: newSceneTitle.trim(),
          location: newSceneLocation.trim(),
          timeOfDay: newSceneTimeOfDay,
          pageCount: 1,
          elements: []
        };
        setScenes([...scenes, newScene]);
      }
      setNewSceneTitle('');
      setNewSceneLocation('');
      setNewSceneTimeOfDay('day');
      setShowAddScene(false);
    }
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setNewCharacterName(character.name);
    setNewCharacterRole(character.role);
    setShowAddCharacter(true);
  };

  const handleViewCharacter = (character: Character) => {
    setViewingCharacter(character);
  };

  const handleDeleteCharacter = (characterId: string) => {
    setCharacters(characters.filter(char => char.id !== characterId));
  };

  const handleEditScene = (scene: Scene) => {
    setEditingScene(scene);
    setNewSceneTitle(scene.title);
    setNewSceneLocation(scene.location);
    setNewSceneTimeOfDay(scene.timeOfDay);
    setShowAddScene(true);
  };

  const handleViewScene = (scene: Scene) => {
    setViewingScene(scene);
  };

  const handleDeleteScene = (sceneNumber: string) => {
    setScenes(scenes.filter(scene => scene.number !== sceneNumber));
  };

  const handleAIBreakdown = async () => {
    if (!scriptContent.trim()) {
      toast.error('Please paste your screenplay first!');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      // Parse script content for scenes
      const lines = scriptContent.split('\n');
      const extractedScenes: Scene[] = [];
      const extractedCharacters: Character[] = [];
      const characterMap = new Map();
      
      let currentScene: Partial<Scene> | null = null;
      let sceneCounter = 1;
      
      lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Detect scene headings (INT./EXT.)
        const sceneMatch = trimmed.match(/^(INT|EXT)[\.\s]+(.+?)\s*[-—]\s*(DAY|NIGHT|DAWN|DUSK)/i);
        if (sceneMatch) {
          // Save previous scene if exists
          if (currentScene?.title && currentScene?.location && currentScene?.timeOfDay) {
            extractedScenes.push({
              number: (currentScene as any).number || sceneCounter.toString(),
              title: currentScene.title,
              location: currentScene.location,
              timeOfDay: currentScene.timeOfDay,
              pageCount: 1,
              elements: []
            });
            sceneCounter++;
          }
          
          // Start new scene
          const locationType = sceneMatch[1].toUpperCase();
          const location = sceneMatch[2].trim();
          const timeOfDay = sceneMatch[3].toLowerCase() as 'day' | 'night' | 'dawn' | 'dusk';
          
          currentScene = {
            number: sceneCounter.toString(),
            title: `${locationType} ${location}`,
            location: `${locationType} ${location}`,
            timeOfDay,
            pageCount: 1,
            elements: []
          };
        }
        
        // Detect character names (ALL CAPS line)
        if (trimmed.length > 0 && trimmed === trimmed.toUpperCase() && trimmed.length < 40 && trimmed.length > 2) {
          const nextLine = lines[index + 1]?.trim();
          // Check if next line is dialogue (not scene heading, not all caps)
          if (nextLine && nextLine !== nextLine.toUpperCase() && !nextLine.match(/^(INT|EXT)[\.\s]/)) {
            const characterName = trimmed.replace(/\(.*?\)/g, '').trim(); // Remove parentheticals like (V.O.)
            if (!characterMap.has(characterName)) {
              characterMap.set(characterName, {
                id: Date.now().toString() + Math.random(),
                name: characterName,
                role: 'Character',
                scenes: 0
              });
            }
          }
        }
      });
      
      // Save last scene
      if (currentScene) {
        const scene = currentScene as any;
        if (scene.title && scene.location && scene.timeOfDay) {
          extractedScenes.push({
            number: scene.number || sceneCounter.toString(),
            title: scene.title,
            location: scene.location,
            timeOfDay: scene.timeOfDay,
            pageCount: 1,
            elements: []
          });
        }
      }
      
      // Update state with extracted data
      if (extractedScenes.length > 0) {
        setScenes(extractedScenes);
        toast.success(`Found ${extractedScenes.length} scene${extractedScenes.length > 1 ? 's' : ''}!`);
      }
      
      const extractedCharsList = Array.from(characterMap.values());
      if (extractedCharsList.length > 0) {
        setCharacters(extractedCharsList);
        toast.success(`Identified ${extractedCharsList.length} character${extractedCharsList.length > 1 ? 's' : ''}!`);
      }
      
      if (extractedScenes.length === 0 && extractedCharsList.length === 0) {
        toast.error('No scenes or characters detected. Make sure your script uses standard formatting (INT./EXT. for scene headings).');
      }
      
    } catch (error) {
      console.error('AI breakdown failed:', error);
      toast.error('Failed to analyze screenplay. Please check the format.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Script Editor</h1>
              <p className="text-gray-600">Write and format your screenplay</p>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAIBreakdown}
                disabled={isAnalyzing || !scriptContent.trim()}
              >
                <Zap className="w-4 h-4 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'AI Breakdown'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSaveScript}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportPDF}
              >
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button size="sm" className="bg-primary">
                <FileText className="w-4 h-4 mr-2" />
                Final Script
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Toolbar */}
          <div className="w-64 border-r border-gray-200 bg-gray-50 p-4">
            {/* Formatting Tools */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Formatting</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => formatText('bold')}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('italic')}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  onClick={() => formatText('underline')}
                  className="p-2 border border-gray-300 rounded hover:bg-gray-100"
                >
                  <Underline className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Insert Elements */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Insert</h3>
              <div className="space-y-2">
                <button
                  onClick={() => insertElement('scene')}
                  className="w-full p-2 text-left text-sm border border-gray-300 rounded hover:bg-gray-100"
                >
                  Scene Heading
                </button>
                <button
                  onClick={() => insertElement('character')}
                  className="w-full p-2 text-left text-sm border border-gray-300 rounded hover:bg-gray-100"
                >
                  Character Name
                </button>
                <button
                  onClick={() => insertElement('dialogue')}
                  className="w-full p-2 text-left text-sm border border-gray-300 rounded hover:bg-gray-100"
                >
                  Dialogue
                </button>
                <button
                  onClick={() => insertElement('action')}
                  className="w-full p-2 text-left text-sm border border-gray-300 rounded hover:bg-gray-100"
                >
                  Action
                </button>
              </div>
            </div>

            {/* Characters */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Characters</h3>
              <div className="space-y-2">
                {characters.map((character) => (
                  <div key={character.id} className="p-2 bg-white rounded border group">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{character.name}</div>
                        <div className="text-xs text-gray-600">
                          {character.role} • {character.scenes} scenes
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleViewCharacter(character)}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="View details"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleEditCharacter(character)}
                          className="p-1 text-gray-400 hover:text-green-600 rounded"
                          title="Edit character"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCharacter(character.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Delete character"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => setShowAddCharacter(true)}
                  className="w-full p-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-600 hover:border-primary hover:text-primary"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Character
                </button>
              </div>
            </div>

            {/* Script Stats */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pages:</span>
                  <span className="font-medium">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Scenes:</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Characters:</span>
                  <span className="font-medium">{characters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Est. Runtime:</span>
                  <span className="font-medium">2 min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Script Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 p-6">
              <Card className="h-full">
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Script Content
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>Last saved: 2 minutes ago</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 h-full">
                  <div className="h-full">
                    <textarea
                      value={scriptContent}
                      onChange={(e) => setScriptContent(e.target.value)}
                      className="w-full h-full resize-none border-none focus:ring-0 focus:outline-none font-mono text-sm leading-relaxed"
                      style={{
                        fontFamily: 'Courier New, monospace',
                        lineHeight: '1.6',
                      }}
                      placeholder="Paste your screenplay here...

Example format:

INT. COFFEE SHOP - DAY

JOHN enters the coffee shop and walks to the counter.

JOHN
Can I get a large coffee?

BARISTA
Coming right up!

Then click 'AI Breakdown' to analyze scenes and characters."
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              {/* Scene Breakdown */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Scene Breakdown</h3>
                <div className="space-y-3">
                  {scenes.map((scene) => (
                    <Card key={scene.number} className="group">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">Scene {scene.number}</span>
                          <span className="text-xs text-gray-600">{scene.location}</span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{scene.title}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <Users className="w-3 h-3 text-gray-400" />
                            <span>{scene.timeOfDay}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleViewScene(scene)}
                              className="p-1 text-gray-400 hover:text-blue-600 rounded"
                              title="View details"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleEditScene(scene)}
                              className="p-1 text-gray-400 hover:text-green-600 rounded"
                              title="Edit scene"
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteScene(scene.number)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Delete scene"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <button 
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary hover:text-primary mt-3"
                  onClick={() => setShowAddScene(true)}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add Scene
                </button>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Script Notes</h3>
                <Card>
                  <CardContent className="p-4">
                    <textarea
                      placeholder="Add notes about this script..."
                      rows={4}
                      className="w-full text-sm border-none resize-none focus:ring-0 focus:outline-none"
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Version History */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">History</h3>
                <div className="space-y-2">
                  {versions.length === 0 ? (
                    <div className="p-3 bg-gray-50 rounded border border-gray-200 text-center">
                      <p className="text-xs text-gray-500">No saved versions yet</p>
                      <p className="text-xs text-gray-400 mt-1">Click "Save Draft" to create version</p>
                    </div>
                  ) : (
                    versions.slice().reverse().map((version) => (
                      <div 
                        key={version.id} 
                        className={`p-3 rounded border cursor-pointer transition-all ${
                          version.isCurrent 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'bg-white border-gray-200 hover:border-blue-200 hover:bg-blue-25'
                        }`}
                        onClick={() => handleLoadVersion(version)}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-sm">Version {version.version}</span>
                          {version.isCurrent && (
                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded">Current</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600">
                          {version.characters.length} character{version.characters.length !== 1 ? 's' : ''}, {version.scenes.length} scene{version.scenes.length !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(version.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Character Modal */}
      <AnimatePresence>
        {showAddCharacter && (
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
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingCharacter ? 'Edit Character' : 'Add Character'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddCharacter(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Character Name
                    </label>
                    <Input
                      value={newCharacterName}
                      onChange={(e) => setNewCharacterName(e.target.value)}
                      placeholder="Enter character name"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role/Description
                    </label>
                    <Input
                      value={newCharacterRole}
                      onChange={(e) => setNewCharacterRole(e.target.value)}
                      placeholder="e.g. Protagonist, Supporting, etc."
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddCharacter(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddCharacter}
                      className="flex-1 bg-primary"
                    >
                      {editingCharacter ? 'Update Character' : 'Add Character'}
                    </Button>
                  </div>
                </div>
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
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingScene ? 'Edit Scene' : 'Add Scene'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddScene(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scene Title
                    </label>
                    <Input
                      value={newSceneTitle}
                      onChange={(e) => setNewSceneTitle(e.target.value)}
                      placeholder="Enter scene title"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <Input
                      value={newSceneLocation}
                      onChange={(e) => setNewSceneLocation(e.target.value)}
                      placeholder="e.g. INT. LIVING ROOM, EXT. PARK"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time of Day
                    </label>
                    <select
                      value={newSceneTimeOfDay}
                      onChange={(e) => setNewSceneTimeOfDay(e.target.value as 'day' | 'night' | 'dawn' | 'dusk')}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="day">Day</option>
                      <option value="night">Night</option>
                      <option value="dawn">Dawn</option>
                      <option value="dusk">Dusk</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddScene(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddScene}
                      className="flex-1 bg-primary"
                    >
                      {editingScene ? 'Update Scene' : 'Add Scene'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Character Modal */}
      <AnimatePresence>
        {viewingCharacter && (
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
                <h3 className="text-lg font-semibold text-gray-900">Character Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewingCharacter(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-gray-900">{viewingCharacter.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <p className="text-gray-900">{viewingCharacter.role}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scenes</label>
                    <p className="text-gray-900">{viewingCharacter.scenes} scenes</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <Button
                    onClick={() => {
                      setViewingCharacter(null);
                      handleEditCharacter(viewingCharacter);
                    }}
                    className="flex-1"
                  >
                    Edit Character
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewingCharacter(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Scene Modal */}
      <AnimatePresence>
        {viewingScene && (
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
                <h3 className="text-lg font-semibold text-gray-900">Scene Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewingScene(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scene Number</label>
                    <p className="text-gray-900">{viewingScene.number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <p className="text-gray-900">{viewingScene.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <p className="text-gray-900">{viewingScene.location}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time of Day</label>
                    <p className="text-gray-900 capitalize">{viewingScene.timeOfDay}</p>
                  </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <Button
                    onClick={() => {
                      setViewingScene(null);
                      handleEditScene(viewingScene);
                    }}
                    className="flex-1"
                  >
                    Edit Scene
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewingScene(null)}
                    className="flex-1"
                  >
                    Close
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

export default ScriptBreakdownPage;