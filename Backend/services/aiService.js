const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

class AIService {
  constructor() {
    // API configurations
    this.openaiApiKey = process.env.OPENAI_API_KEY;
    this.stabilityApiKey = process.env.STABILITY_API_KEY;
    this.replicateApiKey = process.env.REPLICATE_API_KEY;
    
    // API endpoints
    this.openaiUrl = 'https://api.openai.com/v1/images/generations';
    this.stabilityUrl = 'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image';
    this.replicateUrl = 'https://api.replicate.com/v1/predictions';
    
    // Default settings
    this.defaultSettings = {
      style: 'storyboard-sketch',
      aspectRatio: '16:9',
      quality: 'standard',
      mood: 'neutral'
    };

    // Storyboard-specific style presets
    this.stylePresets = {
      'realistic-sketch': {
        prefix: 'Professional storyboard sketch, pencil drawing style, black and white',
        suffix: 'detailed lineart, film storyboard, cinematic composition'
      },
      'cartoon-sketch': {
        prefix: 'Cartoon storyboard panel, simple line art style, black and white',
        suffix: 'animation storyboard, clear composition, sketch style'
      },
      'detailed-realistic': {
        prefix: 'Detailed realistic storyboard, professional film quality',
        suffix: 'cinematic lighting, film storyboard, detailed illustration'
      },
      'minimalist': {
        prefix: 'Minimalist storyboard sketch, simple clean lines',
        suffix: 'basic composition, essential details only, sketch style'
      },
      'dramatic': {
        prefix: 'Dramatic storyboard panel, high contrast lighting',
        suffix: 'cinematic drama, strong shadows, film noir style'
      }
    };

    // Shot type specific prompts
    this.shotTypePrompts = {
      'wide-shot': 'wide establishing shot showing full environment and context',
      'medium-shot': 'medium shot showing characters from waist up with some background',
      'close-up': 'close-up shot focusing on face and expressions with minimal background',
      'extreme-close-up': 'extreme close-up on specific detail or facial feature',
      'over-shoulder': 'over-the-shoulder shot showing conversation between characters',
      'pov': 'point of view shot from character perspective',
      'establishing': 'establishing shot showing location and setting the scene',
      'insert': 'insert shot focusing on specific object or detail'
    };

    // Camera movement prompts
    this.movementPrompts = {
      'static': 'static camera, stable composition',
      'pan': 'panning camera movement, horizontal motion blur',
      'tilt': 'tilting camera movement, vertical angle',
      'zoom': 'zooming camera effect, depth of field change',
      'dolly': 'dolly camera movement, smooth tracking motion',
      'crane': 'crane shot, elevated camera angle, sweeping movement',
      'handheld': 'handheld camera style, slight natural movement',
      'steadicam': 'smooth steadicam movement, fluid motion'
    };
  }

  // Main method to generate storyboard image
  async generateStoryboardImage(prompt, options = {}) {
    try {
      const {
        provider = 'stability', // 'openai', 'stability', 'replicate'
        style = 'realistic-sketch',
        shotType = 'medium-shot',
        cameraMovement = 'static',
        aspectRatio = '16:9',
        mood = 'neutral',
        location = null,
        timeOfDay = null,
        characters = [],
        enhancePrompt = true
      } = options;

      // Build enhanced prompt
      const enhancedPrompt = enhancePrompt ? 
        this.buildEnhancedPrompt(prompt, { style, shotType, cameraMovement, location, timeOfDay, characters, mood }) : 
        prompt;

      console.log(`🎨 Generating storyboard image with ${provider}...`);
      console.log(`📝 Prompt: ${enhancedPrompt}`);

      let result;
      switch (provider) {
        case 'openai':
          result = await this.generateWithOpenAI(enhancedPrompt, { aspectRatio });
          break;
        case 'stability':
          result = await this.generateWithStability(enhancedPrompt, { aspectRatio, style });
          break;
        case 'replicate':
          result = await this.generateWithReplicate(enhancedPrompt, { aspectRatio, style });
          break;
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }

      return {
        success: true,
        data: {
          imageUrl: result.imageUrl,
          provider: provider,
          prompt: enhancedPrompt,
          originalPrompt: prompt,
          settings: options,
          generatedAt: new Date(),
          generationId: uuidv4()
        }
      };
    } catch (error) {
      console.error('❌ AI image generation failed:', error.message);
      return {
        success: false,
        message: error.message,
        provider: options.provider || 'stability'
      };
    }
  }

  // Generate with OpenAI DALL-E
  async generateWithOpenAI(prompt, options = {}) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { aspectRatio = '16:9' } = options;
    const size = this.getOpenAISize(aspectRatio);

    console.log('🤖 Calling OpenAI with:', {
      prompt: prompt,
      size: size,
      model: 'dall-e-3'
    });

    try {
      const response = await axios.post(this.openaiUrl, {
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: 'standard',
        style: 'natural' // or 'vivid'
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ OpenAI Response received successfully');
      
      return {
        imageUrl: response.data.data[0].url,
        revisedPrompt: response.data.data[0].revised_prompt
      };
    } catch (error) {
      console.error('❌ OpenAI API Error:', error.response?.data || error.message);
      console.error('📊 Error status:', error.response?.status);
      
      if (error.response?.data?.error) {
        throw new Error(`OpenAI API Error: ${error.response.data.error.message || error.response.data.error}`);
      }
      
      throw new Error(`OpenAI API request failed: ${error.message}`);
    }
  }

  // Generate with Stability AI
  async generateWithStability(prompt, options = {}) {
    if (!this.stabilityApiKey) {
      throw new Error('Stability AI API key not configured');
    }

    const { aspectRatio = '16:9', style = 'realistic-sketch' } = options;
    const dimensions = this.getStabilityDimensions(aspectRatio);

    console.log('🎨 Calling Stability AI with:', {
      prompt: prompt,
      dimensions: dimensions,
      style: style,
      style_preset: this.getStabilityStylePreset(style)
    });

    try {
      const response = await axios.post(this.stabilityUrl, {
        text_prompts: [
          {
            text: prompt,
            weight: 1
          }
        ],
        cfg_scale: 7,
        height: dimensions.height,
        width: dimensions.width,
        samples: 1,
        steps: 30,
        style_preset: this.getStabilityStylePreset(style)
      }, {
        headers: {
          'Authorization': `Bearer ${this.stabilityApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('✅ Stability AI Response received successfully');

      // Stability returns base64 image, we need to upload it
      const base64Image = response.data.artifacts[0].base64;
      const imageUrl = await this.uploadBase64Image(base64Image);

      return { imageUrl };
    } catch (error) {
      console.error('❌ Stability AI API Error:', error.response?.data || error.message);
      console.error('📊 Error status:', error.response?.status);
      console.error('🔑 API Key length:', this.stabilityApiKey?.length || 'undefined');
      
      if (error.response?.data?.message) {
        throw new Error(`Stability AI API Error: ${error.response.data.message}`);
      }
      
      throw new Error(`Stability AI API request failed: ${error.message}`);
    }
  }

  // Generate with Replicate (for Midjourney-style results)
  async generateWithReplicate(prompt, options = {}) {
    if (!this.replicateApiKey) {
      throw new Error('Replicate API key not configured');
    }

    const { aspectRatio = '16:9' } = options;

    // Using Midjourney model on Replicate
    const response = await axios.post(this.replicateUrl, {
      version: "436b051ebd8f68d23e83d22de5e198e0995357afef113768c20f0b6fcef23c8b", // Midjourney model
      input: {
        prompt: prompt,
        aspect_ratio: aspectRatio,
        output_format: "jpg",
        output_quality: 80
      }
    }, {
      headers: {
        'Authorization': `Token ${this.replicateApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Replicate is async, we need to poll for results
    const predictionId = response.data.id;
    const imageUrl = await this.pollReplicateResult(predictionId);

    return { imageUrl };
  }

  // Build enhanced prompt with context
  buildEnhancedPrompt(basePrompt, options) {
    const {
      style = 'realistic-sketch',
      shotType = 'medium-shot',
      cameraMovement = 'static',
      location = null,
      timeOfDay = null,
      characters = [],
      mood = 'neutral'
    } = options;

    let enhancedPrompt = '';

    // Add style prefix
    if (this.stylePresets[style]) {
      enhancedPrompt += this.stylePresets[style].prefix + '. ';
    }

    // Add shot type description
    if (this.shotTypePrompts[shotType]) {
      enhancedPrompt += this.shotTypePrompts[shotType] + '. ';
    }

    // Add camera movement
    if (this.movementPrompts[cameraMovement]) {
      enhancedPrompt += this.movementPrompts[cameraMovement] + '. ';
    }

    // Add location context
    if (location) {
      enhancedPrompt += `Location: ${location.type} - ${location.name}`;
      if (timeOfDay) {
        enhancedPrompt += ` during ${timeOfDay}`;
      }
      enhancedPrompt += '. ';
    }

    // Add characters context
    if (characters && characters.length > 0) {
      const characterDesc = characters.map(char => `${char.name} (${char.role})`).join(', ');
      enhancedPrompt += `Characters: ${characterDesc}. `;
    }

    // Add main prompt
    enhancedPrompt += basePrompt + '. ';

    // Add mood
    if (mood !== 'neutral') {
      enhancedPrompt += `Mood: ${mood}. `;
    }

    // Add style suffix
    if (this.stylePresets[style]) {
      enhancedPrompt += this.stylePresets[style].suffix;
    }

    return enhancedPrompt;
  }

  // Generate script suggestions using AI
  async generateScriptSuggestions(sceneDescription, options = {}) {
    try {
      if (!this.openaiApiKey) {
        throw new Error('OpenAI API key not configured for script generation');
      }

      const {
        type = 'dialogue', // 'dialogue', 'action', 'both'
        genre = 'drama',
        characters = [],
        tone = 'neutral'
      } = options;

      let systemPrompt = '';
      let userPrompt = '';

      if (type === 'dialogue' || type === 'both') {
        systemPrompt = `You are a professional screenwriter. Generate realistic dialogue for film scenes. 
                       Format: CHARACTER NAME: dialogue text. Keep dialogue natural and character-appropriate.`;
        
        userPrompt = `Scene: ${sceneDescription}\n`;
        if (characters.length > 0) {
          userPrompt += `Characters: ${characters.map(c => c.name).join(', ')}\n`;
        }
        userPrompt += `Genre: ${genre}\nTone: ${tone}\n\nGenerate appropriate dialogue:`;
      }

      if (type === 'action' || type === 'both') {
        systemPrompt = `You are a professional screenwriter. Generate concise, visual action descriptions for film scenes.
                       Write in present tense, be specific and visual. Focus on what the camera sees.`;
        
        userPrompt = `Scene: ${sceneDescription}\nGenerate action description:`;
      }

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const suggestion = response.data.choices[0].message.content;

      return {
        success: true,
        data: {
          suggestion,
          type,
          sceneDescription,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('❌ Script generation failed:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Auto-suggest storyboard improvements
  async suggestStoryboardImprovements(scenes) {
    try {
      if (!this.openaiApiKey) {
        return { success: false, message: 'OpenAI API key not configured' };
      }

      const scenesSummary = scenes.map(scene => ({
        sceneNumber: scene.sceneNumber,
        title: scene.title,
        description: scene.description,
        panelCount: scene.storyboard?.panels?.length || 0,
        location: scene.location
      }));

      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a professional storyboard artist and film director. 
                     Analyze storyboard sequences and suggest improvements for better visual storytelling.
                     Focus on shot variety, pacing, visual flow, and cinematic techniques.`
          },
          {
            role: 'user',
            content: `Analyze this storyboard sequence and suggest improvements:\n${JSON.stringify(scenesSummary, null, 2)}`
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const suggestions = response.data.choices[0].message.content;

      return {
        success: true,
        data: {
          suggestions,
          analyzedScenes: scenesSummary.length,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      console.error('❌ Storyboard analysis failed:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Helper methods
  getOpenAISize(aspectRatio) {
    const sizeMap = {
      '1:1': '1024x1024',
      '16:9': '1792x1024', 
      '9:16': '1024x1792'
    };
    return sizeMap[aspectRatio] || '1024x1024';
  }

  getStabilityDimensions(aspectRatio) {
    const dimensionMap = {
      '1:1': { width: 1024, height: 1024 },
      '16:9': { width: 1152, height: 648 },
      '9:16': { width: 648, height: 1152 }
    };
    return dimensionMap[aspectRatio] || { width: 1024, height: 1024 };
  }

  getStabilityStylePreset(style) {
    const presetMap = {
      'realistic-sketch': 'line-art',
      'cartoon-sketch': 'comic-book',
      'detailed-realistic': 'photographic',
      'minimalist': 'line-art',
      'dramatic': 'cinematic'
    };
    return presetMap[style] || 'line-art';
  }

  // Upload base64 image to storage service
  async uploadBase64Image(base64Data) {
    try {
      const storageService = require('./storageService');
      
      // Convert base64 to buffer
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Create fake file object for storage service
      const fakeFile = {
        buffer: buffer,
        originalname: `ai-generated-${Date.now()}.jpg`,
        mimetype: 'image/jpeg',
        size: buffer.length
      };

      const result = await storageService.uploadFile(fakeFile, {
        folder: 'ai-generated/storyboards'
      });

      return result.url;
    } catch (error) {
      console.error('❌ Failed to upload base64 image:', error);
      throw error;
    }
  }

  // Poll Replicate for async result
  async pollReplicateResult(predictionId, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(`${this.replicateUrl}/${predictionId}`, {
          headers: {
            'Authorization': `Token ${this.replicateApiKey}`
          }
        });

        if (response.data.status === 'succeeded') {
          return response.data.output[0]; // Return first image URL
        } else if (response.data.status === 'failed') {
          throw new Error('Replicate generation failed');
        }

        // Wait 2 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
      }
    }

    throw new Error('Replicate generation timeout');
  }

  // Get available AI providers
  getAvailableProviders() {
    const providers = [];

    if (this.openaiApiKey) {
      providers.push({
        name: 'openai',
        displayName: 'OpenAI DALL-E',
        features: ['high-quality', 'fast', 'reliable'],
        supportedSizes: ['1:1', '16:9', '9:16']
      });
    }

    if (this.stabilityApiKey) {
      providers.push({
        name: 'stability',
        displayName: 'Stability AI',
        features: ['customizable', 'artistic-styles', 'detailed'],
        supportedSizes: ['1:1', '16:9', '9:16']
      });
    }

    if (this.replicateApiKey) {
      providers.push({
        name: 'replicate',
        displayName: 'Midjourney (Replicate)',
        features: ['artistic', 'creative', 'unique-style'],
        supportedSizes: ['1:1', '16:9', '9:16']
      });
    }

    return providers;
  }

  // Validate generation options
  validateOptions(options) {
    const errors = [];

    if (options.provider && !this.getAvailableProviders().some(p => p.name === options.provider)) {
      errors.push(`Unsupported provider: ${options.provider}`);
    }

    if (options.aspectRatio && !['1:1', '16:9', '9:16'].includes(options.aspectRatio)) {
      errors.push(`Unsupported aspect ratio: ${options.aspectRatio}`);
    }

    if (options.style && !Object.keys(this.stylePresets).includes(options.style)) {
      errors.push(`Unsupported style: ${options.style}`);
    }

    return errors;
  }
}

module.exports = new AIService();