'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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

const ScriptBreakdownPage = () => {
  useRequireAuth();
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, isLoading } = useCurrentProject(projectId);

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [scriptElements, setScriptElements] = useState<ScriptElement[]>([]);
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
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button variant="outline" size="sm">
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
                      placeholder="Start writing your script here..."
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
                <h3 className="font-semibold text-gray-900 mb-3">Version History</h3>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">Version 1.0</span>
                      <span className="text-xs text-gray-600">Current</span>
                    </div>
                    <p className="text-xs text-gray-600">Initial script draft</p>
                    <p className="text-xs text-gray-500">Today, 2:30 PM</p>
                  </div>
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