'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  Film, 
  Palette, 
  Calendar, 
  DollarSign, 
  MapPin, 
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

const HomePage = () => {
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch for random animations
  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: Film,
      title: 'Visual Storyboarding',
      description: 'Create stunning storyboards with AI-powered image generation and intuitive drag-and-drop tools.',
      gradient: 'from-blue-500 to-purple-600'
    },
    {
      icon: Palette,
      title: 'Script Management',
      description: 'Write, edit, and collaborate on scripts with real-time synchronization and version control.',
      gradient: 'from-purple-500 to-pink-600'
    },
    {
      icon: Calendar,
      title: 'Production Scheduling',
      description: 'Plan your shoots with intelligent scheduling that considers locations, cast, and equipment.',
      gradient: 'from-pink-500 to-red-600'
    },
    {
      icon: DollarSign,
      title: 'Budget Management',
      description: 'Track expenses, manage budgets, and get detailed financial reports for your productions.',
      gradient: 'from-red-500 to-orange-600'
    },
    {
      icon: MapPin,
      title: 'Location Database',
      description: 'Discover and manage filming locations with integrated maps and availability tracking.',
      gradient: 'from-orange-500 to-yellow-600'
    },
    {
      icon: FileText,
      title: 'Export & Sharing',
      description: 'Export your work in multiple formats and collaborate seamlessly with your team.',
      gradient: 'from-yellow-500 to-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Animation - only render on client to prevent hydration mismatch */}
        <div className="absolute inset-0">
          {mounted && Array.from({ length: 20 }, (_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary-300 rounded-full opacity-30"
              animate={{
                y: [0, -50, 0],
                x: [0, Math.random() * 100 - 50, 0],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 5 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="mb-8"
            >
              <img 
                src="/logo.png" 
                alt="CineCore Logo" 
                className="w-24 h-24 mx-auto mb-8 drop-shadow-2xl"
              />
            </motion.div>

            {/* Hero Text */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-6xl md:text-8xl font-black text-gray-900 mb-8 leading-tight"
            >
              Welcome to
              <span className="block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">CineCore</span>
              <span className="text-4xl md:text-5xl font-semibold text-gray-600 block mt-2">
                Professional Film Production Platform
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl md:text-2xl text-gray-700 mb-12 leading-relaxed font-medium max-w-4xl mx-auto"
            >
              From concept to screen - streamline your entire film production workflow with AI-powered storyboarding, 
              intelligent scheduling, budget tracking, and seamless team collaboration.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <Link href="/register">
                <Button variant="premium" size="xl" className="px-12 py-4 text-lg font-bold group shadow-2xl">
                  Start Creating Free
                  <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                </Button>
              </Link>
              
              <Link href="/login">
                <Button variant="outline" size="xl" className="px-12 py-4 text-lg font-semibold border-2 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50">
                  Sign In
                </Button>
              </Link>
            </motion.div>

            {/* Features Preview */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="flex flex-wrap justify-center gap-6 text-sm text-gray-600"
            >
              {['AI Storyboarding', 'Smart Scheduling', 'Budget Tracking', 'Team Collaboration'].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.1, duration: 0.5 }}
                  className="flex items-center gap-2 bg-white/50 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-200"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {feature}
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-primary-500" />
              <span className="text-primary-600 font-semibold">FEATURES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need for
              <span className="text-primary-600"> Film Production</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From initial concept to final cut, our platform provides all the tools you need to manage your film production professionally.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <Card className="h-full group cursor-pointer overflow-hidden">
                    <CardContent className="p-8">
                      <div className={`w-14 h-14 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose CineCore Section */}
      <section className="py-24 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Choose <span className="text-primary-600">CineCore</span>?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built by filmmakers, for filmmakers. Experience the difference of a platform designed specifically for your creative workflow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'AI-Powered Tools',
                description: 'Leverage cutting-edge AI to generate storyboard images and streamline your pre-production process.',
                icon: '🤖',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                title: 'Export & Share',
                description: 'Export your storyboards, scripts, and schedules in PDF, image, or video formats for easy sharing.',
                icon: '📤',
                color: 'from-purple-500 to-pink-500'
              },
              {
                title: 'All-in-One Platform',
                description: 'From script to schedule to budget - manage every aspect of your production in one place.',
                icon: '⚡',
                color: 'from-orange-500 to-red-500'
              },
              {
                title: 'Professional Results',
                description: 'Export production-ready documents and presentations that impress clients and investors.',
                icon: '🎬',
                color: 'from-green-500 to-emerald-500'
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="h-full text-center hover:shadow-2xl transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className={`text-6xl mb-4 bg-gradient-to-r ${benefit.color} bg-clip-text`}>
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {benefit.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-400 to-purple-400">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Filmmaking?
            </h2>
            <p className="text-xl mb-12 opacity-90 max-w-2xl mx-auto">
              Join CineCore and turn your filmmaking dreams into reality
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="px-12 py-4 text-lg font-semibold bg-white text-primary-600 hover:bg-gray-100">
                Get Started Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-8 md:mb-0">
              <img 
                src="/logo.png" 
                alt="CineCore Logo" 
                className="w-12 h-12"
              />
              <span className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">CineCore</span>
            </div>
            
            <div className="flex gap-8">
              <Link href="/login" className="hover:text-primary-400 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="hover:text-primary-400 transition-colors">
                Sign Up
              </Link>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>CineCore 2025.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;