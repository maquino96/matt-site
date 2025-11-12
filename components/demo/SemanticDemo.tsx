import { Box, Button, Text, VStack, Heading, Badge } from "@chakra-ui/react";

export function SemanticDemo() {
  return (
    <VStack align="stretch" gap={6} p={6} bg="white">
      <Heading color="gray.900" fontSize="2xl" fontWeight="bold">
        Semantic Token Demo
      </Heading>
      
      <Text color="gray.800" fontSize="lg">
        This component demonstrates consistent color usage throughout the app.
      </Text>
      
      <Box bg="gray.50" borderColor="gray.200" borderWidth="1px" p={4} rounded="md">
        <Text color="gray.600">
          All colors follow the semantic color mapping system.
        </Text>
      </Box>

      <Box bg="gray.50" borderColor="gray.200" borderWidth="1px" p={4} rounded="md">
        <Text color="gray.800">Surface container with border</Text>
      </Box>

      <Box bg="gray.100" p={4} rounded="md">
        <Text color="gray.800">Muted background container</Text>
      </Box>

      <VStack gap={3}>
        <Button variant="solid" colorScheme="teal">Primary action</Button>
        <Button variant="ghost" colorScheme="teal">Ghost action</Button>
        <Button colorScheme="cyan">Accent button</Button>
      </VStack>

      <Box>
        <Badge colorScheme="teal" mr={2}>Brand badge</Badge>
        <Badge colorScheme="cyan">Accent badge</Badge>
      </Box>

      <Box>
        <Text color="teal.600" cursor="pointer" _hover={{ color: "teal.700" }}>
          Hover over this link
        </Text>
      </Box>
    </VStack>
  );
}
