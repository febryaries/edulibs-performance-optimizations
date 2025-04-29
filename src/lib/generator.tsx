import { z } from "zod";
import { gen3Schema } from "@/schemas/gen-3-schema";
import { gen6Schema } from "@/schemas/gen-6-schema";

// Type for the input data based on gen3Schema
export type Gen3Data = z.infer<typeof gen3Schema>;
export type Gen6Data = z.infer<typeof gen6Schema>;

/**
 * Generates and downloads an annex document based on the provided data
 * @param data The data to use for generating the document
 * @returns A promise that resolves when the document has been generated and download initiated
 */
export const generateAnnex3 = async (data: Gen3Data): Promise<void> => {
  try {
    // Validate the data against the schema
    const validatedData = gen3Schema.parse(data);
    
    // Prepare the request payload
    const payload = {
      anex_type: "3",
      ...validatedData,
      // Convert date to string if present
      today: validatedData.today ? validatedData.today.toLocaleDateString("ro-RO") : new Date().toLocaleDateString("ro-RO"),
    };
    
    // Send request to the API
    const response = await fetch('/api/generate-annex', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate document');
    }
    
    // Get the document as a blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anexa_3_${validatedData.serial_number}_RED.docx`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating annex:', error);
    return Promise.reject(error);
  }
};

export const generateAnnex6 = async (data: Gen6Data): Promise<void> => {
  try {
    // Validate the data against the schema
    const validatedData = gen6Schema.parse(data);
    
    // Prepare the request payload
    const payload = {
      anex_type: "6",
      ...validatedData,
      // Convert date to string if present
      evaluation_date: validatedData.evaluation_date ? validatedData.evaluation_date.toLocaleDateString("ro-RO") : new Date().toLocaleDateString("ro-RO"),
    }

    // Send request to the API
    // Send request to the API
    const response = await fetch('/api/generate-annex', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate document');
    }
    
    // Get the document as a blob
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `anexa_3_${validatedData.serial_number}_RED.docx`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating annex:', error);
    return Promise.reject(error);
  }
};