'use client'

import { ChakraProvider } from '@chakra-ui/react'
import { defaultSystem } from '@chakra-ui/react'

interface ProviderProps {
  children: React.ReactNode
}

export function Provider({ children }: ProviderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <div className="chakra-theme">
        {children}
      </div>
    </ChakraProvider>
  )
}
