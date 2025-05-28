import { UnstructuredClient } from "unstructured-client";
import { Strategy } from "unstructured-client/sdk/models/shared";
const client = new UnstructuredClient({
  serverURL: process.env.UNSTRUCTURED_API_URL,
  security: {
    apiKeyAuth: process.env.UNSTRUCTURED_API_KEY,
  },
});

interface UnstructuredElement {
  type: string;
  element_id: string;
  text: string;
  metadata: {
    page_number: number;
    filename: string;
    filetype: string;
    languages: string[];
  };
}

function organizeTextByPage(elements: UnstructuredElement[]): string[] {
  // Find the maximum page number to determine array size
  const maxPage = Math.max(...elements.map(el => el.metadata.page_number));
  
  // Create array with empty strings for each page (0-based index)
  const pageTexts: string[] = Array(maxPage).fill('');
  
  // Sort elements by page number and position (if you want to maintain order within page)
  elements.forEach(element => {
    const pageIndex = element.metadata.page_number - 1;
    // Append text with a space separator
    pageTexts[pageIndex] += element.text + ' ';
  });
  
  // Trim extra spaces and return
  return pageTexts.map(text => text.trim());
}


export async function processFileWithUnstructured(file_buffer: ArrayBuffer, file_name: string) {
  try {
    const response = await client.general.partition({
      partitionParameters: {
        files: {
          content: file_buffer,
          fileName: file_name,
        },
        contentType: "application/pdf",
        chunkingStrategy: "by_page",
        coordinates: false,
        strategy: Strategy.Fast,
        splitPdfPage: true,
        splitPdfAllowFailed: true,
        splitPdfConcurrencyLevel: 30,
        languages: ['eng']
      }
    });
    if (response?.length > 0) {
       return organizeTextByPage(response as UnstructuredElement[]);
    }

  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'body' in error) {
      console.error('API Error:', error.statusCode, error.body);
    } else {
      console.error('Error:', error);
    }
    throw error;
  }
}
