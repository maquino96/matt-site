'use client'

import { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Box,
  VStack,
  IconButton,
  Spinner,
  Text
} from '@chakra-ui/react';
import { MdHome, MdOutlineDrafts, MdSettings } from 'react-icons/md';
import { semanticColors } from '@/theme/theme';
import AdminPasswordModal from '@/components/AdminPasswordModal';

export interface Post {
  id: string
  title: string
  content: string
  published: boolean
}

export interface ThinSideNavProps {
  expandedWidth?: number;
  triggerWidth?: number;
  onOpenChange?: (open: boolean) => void;
  onDraftSelect?: (post: Post) => void;
  setRefetchDrafts?: (refetchFn: () => void) => void;
}

export default function ThinSideNav({
  expandedWidth = 64,
  triggerWidth = expandedWidth,
  onOpenChange,
  onDraftSelect,
  setRefetchDrafts
}: ThinSideNavProps) {
  const [open, setOpen] = useState(false);
  const [drafts, setDrafts] = useState<Post[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasFetchedDrafts, setHasFetchedDrafts] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleOpen = () => {
    setOpen(true);
    onOpenChange?.(true);
  };

  const handleClose = () => {
    setOpen(false);
    onOpenChange?.(false);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const fetchDrafts = useCallback(async () => {
    setLoadingDrafts(true);
    try {
      const response = await fetch('/api/posts?published=false');
      if (!response.ok) {
        if (response.status === 401) {
          setShowAdminModal(true);
          return;
        }
        throw new Error('Failed to fetch drafts');
      }
      const data = await response.json();
      setDrafts(data);
      setHasFetchedDrafts(true);
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoadingDrafts(false);
    }
  }, []);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpen) {
        const menuElement = document.querySelector('[data-drafts-menu]');
        const buttonElement = document.querySelector('[data-drafts-button]');
        const sidebarElement = document.querySelector('[data-sidenav]');
        
        const target = event.target as Node;
        const insideSidebar = !!(sidebarElement && sidebarElement.contains(target));
        const insideMenuOrButton = !!((menuElement && menuElement.contains(target)) || (buttonElement && buttonElement.contains(target)));
        
        if (!insideMenuOrButton) {
          setMenuOpen(false);
          if (!insideSidebar) {
            setTimeout(() => handleClose(), 120); // retract after menu closes
          }
        }
      }
    };

    // Handle Escape key to close menu
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (menuOpen && event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [menuOpen]);

  const handleDraftClick = useCallback(async () => {
    if (menuOpen) {
      setMenuOpen(false);
      return;
    }
    setMenuOpen(true);
    if (!hasFetchedDrafts) {
      await fetchDrafts();
    }
  }, [menuOpen, hasFetchedDrafts, fetchDrafts]);

  const handleDraftSelect = useCallback((post: Post) => {
    const targetPath = '/admin/editor';
    if (pathname !== targetPath) {
      router.push(`${targetPath}?draftId=${post.id}`);
      setMenuOpen(false);
      return;
    }
    onDraftSelect?.(post);
    setMenuOpen(false);
  }, [onDraftSelect, pathname, router]);

  // Expose refetch function to parent
  useEffect(() => {
    setRefetchDrafts?.(fetchDrafts);
  }, [setRefetchDrafts, fetchDrafts]);

  // Static colors for editor interface (dark mode preferred)
  const bgColor = 'gray.900';
  const borderColor = 'teal.600';
  const hoverBg = 'teal.500';
  const hoverColor = 'white';

  const navItems = [
    {
      icon: MdHome,
      label: 'Home',
      path: '/',
      tooltip: 'Go to Home',
      onClick: () => handleNavigation('/')
    },
    {
      icon: MdOutlineDrafts,
      label: 'Drafts',
      path: '/drafts',
      tooltip: 'View Drafts',
      onClick: handleDraftClick
    },
    {
      icon: MdSettings,
      label: 'Settings',
      path: '/profile',
      tooltip: 'Settings',
      onClick: () => handleNavigation('/profile')
    }
  ];

  return (
    <>
      {/* Trigger zone - left edge hover detection */}
      <Box
        position="fixed"
        left={0}
        top={0}
        bottom={0}
        width={`${triggerWidth}px`}
        onMouseEnter={handleOpen}
        zIndex={999}
        cursor="default"
      />

      {/* Sidebar */}
      <Box
        position="fixed"
        left={0}
        top={0}
        bottom={0}
        width={open ? `${expandedWidth}px` : '0px'}
        bg={bgColor}
        borderRightWidth="1px"
        borderColor={borderColor}
        overflow="hidden"
        transition="width 0.2s ease-in-out"
        zIndex={1000}
        onMouseEnter={handleOpen}
        onMouseLeave={() => { if (!menuOpen) handleClose() }}
        boxShadow={open ? 'xl' : 'none'}
        data-sidenav="true"
      >
        <VStack
          gap={3}
          p={3}
          height="100vh"
          justifyContent="center"
          alignItems="center"
        >
          {navItems.map((item) => (
            <Box key={item.label} position="relative">
              <IconButton
                aria-label={item.label}
                size="lg"
                variant="ghost"
                color="gray.300"
                _hover={{
                  bg: hoverBg,
                  color: hoverColor,
                  transform: 'scale(1.1)'
                }}
                _active={{
                  bg: hoverBg,
                  color: hoverColor
                }}
                transition="all 0.2s ease-in-out"
                onClick={item.onClick}
                title={open ? undefined : item.tooltip}
                data-drafts-button={item.label === 'Drafts' ? 'true' : undefined}
              >
                <item.icon />
              </IconButton>

              {/* Custom dropdown for drafts */}
              {item.label === 'Drafts' && menuOpen && (
                <Box
                  position="fixed"
                  top="50%"
                  transform="translateY(-50%)"
                  left={`${expandedWidth + 8}px`}
                  bg={semanticColors.surfaceDark}
                  borderWidth="1px"
                  borderColor={semanticColors.borderDark}
                  borderRadius="md"
                  minW="200px"
                  maxH="300px"
                  overflowY="auto"
                  zIndex={1001}
                  boxShadow="lg"
                  data-drafts-menu="true"
                >
                  {loadingDrafts ? (
                    <Box p={3} display="flex" alignItems="center">
                      <Spinner size="sm" mr={2} />
                      <Text>Loading drafts...</Text>
                    </Box>
                  ) : drafts.length === 0 ? (
                    <Box p={3}>
                      <Text color={semanticColors.textMutedDark}>No drafts found</Text>
                    </Box>
                  ) : (
                    drafts.map((draft) => (
                      <Box
                        key={draft.id}
                        p={3}
                        cursor="pointer"
                        _hover={{
                          bg: semanticColors.primaryHoverDark,
                          color: semanticColors.textDark
                        }}
                        _active={{
                          bg: semanticColors.primaryDark,
                          color: semanticColors.textDark
                        }}
                        onClick={() => handleDraftSelect(draft)}
                      >
                        {draft.title}
                      </Box>
                    ))
                  )}
                </Box>
              )}
            </Box>
          ))}
        </VStack>
      </Box>
      <AdminPasswordModal isOpen={showAdminModal} onClose={() => setShowAdminModal(false)} />
    </>
  );
}
