"use client";
import React, { useState } from 'react';
import { DollarSign, FileText, Mail, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <nav className="fixed top-0 left-0 right-0  bg-gray-900/80 backdrop-blur-sm z-50 w-full">
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
    
          <Link href="/">
            <Image 
                src="Logo.svg"
                // layout='fill'
                width="1000"
                height="1000"
                alt='Logo'
                className='h-12 w-44 object-contain'
            />
            </Link>
          
          {/* Mobile hamburger menu button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center text-gray-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-3 lg:gap-6">
            <a
              href="#docs"
              className="text-sm lg:text-base text-gray-300 hover:text-white flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Docs</span>
            </a>
            <a 
              href="#pricing" 
              className="text-sm lg:text-base text-gray-300 hover:text-white flex items-center gap-2"
            >
            <DollarSign className="w-4 h-4"/>
              Pricing
            </a>
            <a
              href="mailto:contact@syncscribe.ai"
              className="text-sm lg:text-base text-gray-300 hover:text-white flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Contact</span>
            </a>
            <a
              href="#"
              className="bg-blue-500 hover:bg-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 text-sm lg:text-base rounded-full text-white transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div 
          className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
            mobileMenuOpen 
              ? 'max-h-64 opacity-100 mt-2' 
              : 'max-h-0 opacity-0'
          }`}
        >
          <div className="py-3 space-y-2 flex flex-col">
          <a
              href="#docs"
              className="text-gray-300 hover:text-white py-2 px-3 rounded-md hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Docs
              </div>
            </a>
            <a 
              href="#pricing" 
              className="text-gray-300 hover:text-white py-2 px-3 rounded-md hover:bg-gray-800 transition-colors"
            >
              Pricing
            </a>
            <a
              href="mailto:contact@syncscribe.ai"
              className="text-gray-300 hover:text-white py-2 px-3 rounded-md hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact
              </div>
            </a>
            <a
              href="#"
              className="bg-blue-500 hover:bg-blue-600 mt-2 mx-3 px-4 py-2 rounded-full text-white text-center transition-colors"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;