// API route for generating document annexes
import fs from 'fs';
import path from 'path';
import { TemplateHandler } from 'easy-template-x';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Parse the JSON body
    const params = await req.json();
    
    // Get the anexa type and other parameters
    const { anex_type, ...templateData } = params;
    
    // Validate anexa type
    if (!anex_type || (anex_type !== '3' && anex_type !== '6')) {
      return NextResponse.json({ 
        error: 'Invalid anex_type parameter. Must be either "3" or "6"' 
      }, { status: 400 });
    }
    
    // Set the file name based on the template type
    const templateName = `anexa_${anex_type}.docx`;
    const outputName = `anexa_${anex_type}_generated.docx`;
    
    // Build the template file path
    const templatePath = path.join(process.cwd(), 'public', templateName);
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ 
        error: `Template ${templateName} not found in public directory` 
      }, { status: 404 });
    }
    
    // Add current date if not provided
    if (!templateData.currentDate) {
      templateData.currentDate = new Date().toLocaleDateString();
    }
    
    // Prepare data for templating
    // Make sure all values are strings to avoid type errors with the template engine
    const data = Object.entries(templateData).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value ? String(value) : '';
      return acc;
    }, {});
    
    // Log the parameters being used (for debugging)
    console.log(`Generating ${templateName} with parameters:`, data);
    
    // Read the template file
    const templateBuffer = fs.readFileSync(templatePath);
    
    // Process the template
    const handler = new TemplateHandler();
    const documentContent = await handler.process(templateBuffer, data);
    
    // Create a response with the document content
    const response = new NextResponse(Buffer.from(documentContent));
    
    // Set response headers for file download
    response.headers.set('Content-Disposition', `attachment; filename=${outputName}`);
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
    return response;
  } catch (error: any) {
    console.error('Document generation error:', error);
    return NextResponse.json({ 
      error: 'Error generating document', 
      details: error.message 
    }, { status: 500 });
  }
}

// Also support GET requests for flexibility
export async function GET(req: NextRequest) {
  try {
    // Parse the URL search params
    const url = new URL(req.url);
    const anex_type = url.searchParams.get('anex_type');
    
    // Convert search params to an object
    const templateData: Record<string, any> = {};
    url.searchParams.forEach((value, key) => {
      if (key !== 'anex_type') {
        templateData[key] = value;
      }
    });
    
    // Validate anexa type
    if (!anex_type || (anex_type !== '3' && anex_type !== '6')) {
      return NextResponse.json({ 
        error: 'Invalid anex_type parameter. Must be either "3" or "6"' 
      }, { status: 400 });
    }
    
    // Set the file name based on the template type
    const templateName = `anexa_${anex_type}.docx`;
    const outputName = `anexa_${anex_type}_generated.docx`;
    
    // Build the template file path
    const templatePath = path.join(process.cwd(), 'public', templateName);
    
    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      return NextResponse.json({ 
        error: `Template ${templateName} not found in public directory` 
      }, { status: 404 });
    }
    
    // Add current date if not provided
    if (!templateData.currentDate) {
      templateData.currentDate = new Date().toLocaleDateString();
    }
    
    // Prepare data for templating
    // Make sure all values are strings to avoid type errors with the template engine
    const data = Object.entries(templateData).reduce<Record<string, string>>((acc, [key, value]) => {
      acc[key] = value ? String(value) : '';
      return acc;
    }, {});
    
    // Log the parameters being used (for debugging)
    console.log(`Generating ${templateName} with parameters:`, data);
    
    // Read the template file
    const templateBuffer = fs.readFileSync(templatePath);
    
    // Process the template
    const handler = new TemplateHandler();
    const documentContent = await handler.process(templateBuffer, data);
    
    // Create a response with the document content
    const response = new NextResponse(Buffer.from(documentContent));
    
    // Set response headers for file download
    response.headers.set('Content-Disposition', `attachment; filename=${outputName}`);
    response.headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
    return response;
  } catch (error: any) {
    console.error('Document generation error:', error);
    return NextResponse.json({ 
      error: 'Error generating document', 
      details: error.message 
    }, { status: 500 });
  }
}