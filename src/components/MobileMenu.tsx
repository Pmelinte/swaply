'use client';

import { useState } from 'react';
import Link from 'next/link';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
}

export default function MobileMenu({ isOpen, onClose, userId }: MobileMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Swaply Menu</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            <Link
              href="/"
              className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-md"
              onClick={onClose}
            >
              🏠 Acasă
            </Link>
            
            {userId ? (
              <>
                <Link
                  href="/obiecte/nou"
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-md"
                  onClick={onClose}
                >
                  📦 Adaugă Obiect
                </Link>
                <Link
                  href="/cereri"
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-md"
                  onClick={onClose}
                >
                  📋 Cererile Mele
                </Link>
                <Link
                  href="/chat/demo"
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-md"
                  onClick={onClose}
                >
                  💬 Chat
                </Link>
                <Link
                  href="/match"
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-md"
                  onClick={onClose}
                >
                  🎯 Potriviri
                </Link>
                <Link
                  href="/profil"
                  className="block px-3 py-2 text-base font-medium text-gray-900 hover:bg-gray-100 rounded-md"
                  onClick={onClose}
                >
                  👤 Profilul Meu
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                  onClick={onClose}
                >
                  🔑 Conectează-te
                </Link>
                <Link
                  href="/signup"
                  className="block px-3 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  onClick={onClose}
                >
                  ✨ Înregistrează-te
                </Link>
              </>
            )}
            
            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>
            
            {/* Info Links */}
            <Link
              href="/info/despre"
              className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={onClose}
            >
              Despre noi
            </Link>
            <Link
              href="/info/cum-functioneaza"
              className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={onClose}
            >
              Cum funcționează
            </Link>
            <Link
              href="/info/contact"
              className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              onClick={onClose}
            >
              Contact
            </Link>
          </nav>
          
          {/* Footer */}
          <div className="border-t border-gray-200 p-4">
            <p className="text-xs text-gray-500">
              © 2025 Swaply. Toate drepturile rezervate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}