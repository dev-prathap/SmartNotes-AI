// API Route: /api/documents/upload
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.min.mjs';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import { query } from '@/lib/database';
import { verifyAccessToken } from '@/lib/jwt';
import { chunkDocument } from '@/lib/document-chunker';
import { uploadToCloudinary } from '@/lib/cloudinary';

// Add DOMMatrix polyfill for pdfjs-dist
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;
    
    constructor() {}
    
    static fromFloat32Array(array: Float32Array): DOMMatrix {
      return new DOMMatrix();
    }
    
    static fromFloat64Array(array: Float64Array): DOMMatrix {
      return new DOMMatrix();
    }
    
    static fromMatrix(other?: DOMMatrix): DOMMatrix {
      return new DOMMatrix();
    }
    
    multiply() { return this; }
    inverse() { return this; }
    translate() { return this; }
    scale() { return this; }
    rotate() { return this; }
    rotateFromVector() { return this; }
    skewX() { return this; }
    skewY() { return this; }
    flipX() { return this; }
    flipY() { return this; }
    transformPoint() { 
      return { 
        x: 0, 
        y: 0, 
        z: 0, 
        w: 1, 
        matrixTransform: () => this.transformPoint(), 
        toJSON: () => ({ x: 0, y: 0, z: 0, w: 1 }) 
      }; 
    }
    
    // Self-modifying methods
    invertSelf() { return this; }
    multiplySelf() { return this; }
    preMultiplySelf() { return this; }
    rotateAxisAngleSelf() { return this; }
    rotateSelf() { return this; }
    scaleSelf() { return this; }
    scale3dSelf() { return this; }
    scaleNonUniformSelf() { return this; }
    translateSelf() { return this; }
    translate3dSelf() { return this; }
    skewXSelf() { return this; }
    skewYSelf() { return this; }
    setMatrixValue() { return this; }
    flipXSelf() { return this; }
    flipYSelf() { return this; }
    
    // Additional required methods
    rotateAxisAngle() { return this; }
    scale3d() { return this; }
    scaleNonUniform() { return this; }
    toFloat32Array() { return new Float32Array(); }
    toFloat64Array() { return new Float64Array(); }
    rotateFromVectorSelf() { return this; }
    toJSON() { return {}; }
    
    // Properties
    get is2D() { return true; }
    get isIdentity() { return false; }
  };
}

// Set the worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.min.mjs';

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

// Route segment config for Vercel
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Hobby plan: 10s, Pro plan: 60s

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const subjectId = formData.get('subjectId') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/msword'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported. Please upload PDF, Word, or text files.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;

    // Upload to Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await uploadToCloudinary(buffer, uniqueFilename, 'smartnotes-documents');
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return NextResponse.json(
        { error: 'Failed to upload file to cloud storage. Please try a smaller file.' },
        { status: 500 }
      );
    }

    // Extract text content from file
    let contentText = '';
    try {
      if (file.type === 'application/pdf') {
        // Convert Buffer to Uint8Array for pdfjs
        const uint8Array = new Uint8Array(buffer);
        
        // Load the PDF document
        const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
        
        // Extract text from all pages
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + ' ';
        }
        contentText = fullText.trim();
      } else if (file.type.includes('word') || file.type.includes('document')) {
        const result = await mammoth.extractRawText({ buffer });
        contentText = result.value;
      } else if (file.type === 'text/plain') {
        contentText = buffer.toString('utf-8');
      }
      
      // Sanitize content text to remove null bytes and other invalid UTF8 characters
      contentText = contentText.replace(/\x00/g, '').trim();
    } catch (error) {
      console.error('Error extracting text from file:', error);
      contentText = 'Error extracting text content';
    }

    // Generate vector embeddings for document chunks (with timeout protection)
    let mainVectorEmbedding: string | null = null;
    let chunks: string[] = [];
    
    try {
      if (openai && contentText && contentText.trim().length > 0) {
        // Chunk large documents
        chunks = chunkDocument(contentText, 4000, 200);
        
        // Generate embedding for the first chunk
        const embedding = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: chunks[0].substring(0, 8000), // Limit each chunk to 8000 characters
        });
        
        mainVectorEmbedding = `[${embedding.data[0].embedding.join(',')}]`;
      }
    } catch (error) {
      console.error('Error generating embeddings:', error);
      // Continue with null embeddings if generation fails
    }

    // Save document to database with Cloudinary URL
    const documentResult = await query(
      `INSERT INTO documents (
        user_id, subject_id, title, description, file_name, file_path,
        file_size, file_type, mime_type, content_text, vector_embedding,
        processing_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, title, description, file_name, file_size, file_type,
                processing_status, created_at`,
      [
        decoded.userId,
        subjectId || null,
        title,
        description || null,
        file.name,
        cloudinaryResult.url, // Store Cloudinary URL instead of local path
        file.size,
        fileExtension,
        file.type,
        contentText,
        mainVectorEmbedding,
        mainVectorEmbedding ? 'completed' : 'failed'
      ]
    );

    const document = documentResult.rows[0];

    // Save document chunks (process in background to avoid timeout)
    // Only process first 5 chunks immediately, rest can be done async
    if (chunks.length > 0) {
      const chunksToProcess = chunks.slice(0, Math.min(5, chunks.length));
      
      for (let i = 0; i < chunksToProcess.length; i++) {
        // Generate embedding for each chunk
        let chunkVectorEmbedding: string | null = null;
        try {
          if (openai) {
            const embedding = await openai.embeddings.create({
              model: 'text-embedding-ada-002',
              input: chunks[i].substring(0, 8000),
            });
            
            chunkVectorEmbedding = `[${embedding.data[0].embedding.join(',')}]`;
          }
        } catch (error) {
          console.error(`Error generating embedding for chunk ${i}:`, error);
        }
        
        await query(
          `INSERT INTO document_chunks (document_id, chunk_index, content_text, vector_embedding)
           VALUES ($1, $2, $3, $4)`,
          [document.id, i, chunks[i], chunkVectorEmbedding]
        );
      }
      
      // Store remaining chunks without embeddings (can be processed later)
      for (let i = chunksToProcess.length; i < chunks.length; i++) {
        await query(
          `INSERT INTO document_chunks (document_id, chunk_index, content_text, vector_embedding)
           VALUES ($1, $2, $3, $4)`,
          [document.id, i, chunks[i], null]
        );
      }
    }

    return NextResponse.json({
      document,
      message: 'Document uploaded successfully'
    });

  } catch (error: any) {
    console.error('Document upload error:', error);
    
    // Ensure we always return valid JSON
    const errorMessage = error?.message || 'Internal server error';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
