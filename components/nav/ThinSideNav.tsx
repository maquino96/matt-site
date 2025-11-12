'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  VStack,
  IconButton
} from '@chakra-ui/react';
import { MdHome, MdOutlineDrafts, MdSettings } from 'react-icons/md';

export interface ThinSideNavProps {
  expandedWidth?: number;
  triggerWidth?: number;
  onOpenChange?: (open: boolean) => void;
}

export default function ThinSideNav({
  expandedWidth = 64,
  triggerWidth = expandedWidth,
  onOpenChange
}: ThinSideNavProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

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
      tooltip: 'Go to Home'
    },
    {
      icon: MdOutlineDrafts,
      label: 'Drafts',
      path: '/drafts',
      tooltip: 'View Drafts'
    },
    {
      icon: MdSettings,
      label: 'Settings',
      path: '/profile',
      tooltip: 'Settings'
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
        onMouseLeave={handleClose}
        boxShadow={open ? 'xl' : 'none'}
      >
        <VStack
          gap={3}
          p={3}
          height="100vh"
          justifyContent="center"
          alignItems="center"
        >
          {navItems.map((item) => (
            <IconButton
              key={item.label}
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
              onClick={() => handleNavigation(item.path)}
              title={open ? undefined : item.tooltip}
            >
              <item.icon />
            </IconButton>
          ))}
        </VStack>
      </Box>
    </>
  );
}
