import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Textarea,
  VStack
} from '@chakra-ui/react'
import { Save } from 'lucide-react'
import { PageWrap } from '../../../layout'

export default function CreateOrder() {
  return (
    <PageWrap
      title="Create Order"
      subtitle="Create a new customer order"
      rightElements={
        <Button
          leftIcon={<Save size={16} />}
          bg="#176526"
          color="white"
          _hover={{ bg: '#12531e' }}
        >
          Save Order
        </Button>
      }
    >
      <SimpleGrid
        columns={{
          base: 1,
          xl: 2
        }}
        spacing={5}
      >
        <Card
          variant="outline"
          borderRadius="12px"
        >
          <CardBody>
            <VStack
              align="stretch"
              spacing={4}
            >
              <FormControl>
                <FormLabel>
                  Customer
                </FormLabel>
                <Select
                  placeholder="Select customer"
                  bg="gray.100"
                  border="none"
                >
                  <option>John Smith</option>
                  <option>Sarah Johnson</option>
                  <option>Emily Brown</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel>
                  Product
                </FormLabel>
                <Select
                  placeholder="Select product"
                  bg="gray.100"
                  border="none"
                >
                  <option>
                    Professional Lawn Mower
                  </option>
                  <option>
                    Power Drill Set
                  </option>
                  <option>
                    Pressure Washer
                  </option>
                </Select>
              </FormControl>

              <SimpleGrid
                columns={{
                  base: 1,
                  md: 2
                }}
                spacing={4}
              >
                <FormControl>
                  <FormLabel>
                    Quantity
                  </FormLabel>
                  <Input
                    type="number"
                    min={1}
                    defaultValue={1}
                    bg="gray.100"
                    border="none"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>
                    Order Type
                  </FormLabel>
                  <Select
                    bg="gray.100"
                    border="none"
                  >
                    <option>Sale</option>
                    <option>Rental</option>
                  </Select>
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>
                  Notes
                </FormLabel>
                <Textarea
                  placeholder="Additional order notes"
                  bg="gray.100"
                  border="none"
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        <Card
          variant="outline"
          borderRadius="12px"
        >
          <CardBody>
            <VStack
              align="stretch"
              spacing={4}
            >
              <Box>
                <FormLabel>
                  Unit Price
                </FormLabel>
                <Input
                  placeholder="0.00"
                  bg="gray.100"
                  border="none"
                />
              </Box>

              <Box>
                <FormLabel>
                  Discount
                </FormLabel>
                <Input
                  placeholder="0.00"
                  bg="gray.100"
                  border="none"
                />
              </Box>

              <Box>
                <FormLabel>
                  Payment Status
                </FormLabel>
                <Select
                  bg="gray.100"
                  border="none"
                >
                  <option>Pending</option>
                  <option>Paid</option>
                </Select>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>
    </PageWrap>
  )
}
