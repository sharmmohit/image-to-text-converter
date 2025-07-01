'use client'; // This is important for client-side components in the App Router

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { createWorker } from 'tesseract.js';

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [progressLabel, setProgressLabel] = useState<string>('Idle');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // useRef to hold the actual File object
  const imageFileRef = useRef<File | null>(null);

  // Initialize Tesseract worker outside the component for better performance
  // Or, initialize and terminate within the function if you only need it for a single use
  // For this example, we'll create a new worker on each process to simplify state management
  // For a more complex app, consider reusing a single worker.

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      imageFileRef.current = file; // Store the actual File object
      setSelectedImage(URL.createObjectURL(file)); // For image preview
      setExtractedText('');
      setProgress(0);
      setProgressLabel('Idle');
      setError('');
    }
  };

  const processImage = async () => {
    if (!imageFileRef.current) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setExtractedText('');
    setProgress(0);
    setProgressLabel('Loading Tesseract core...');
    setError('');

    try {
      const worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setProgressLabel(`Recognizing text: ${Math.round(m.progress * 100)}%`);
          } else if (m.status === 'loading tesseract core') {
            setProgressLabel('Loading Tesseract core...');
          } else if (m.status === 'initializing tesseract') {
            setProgressLabel('Initializing Tesseract...');
          } else if (m.status === 'loading language traineddata') {
            setProgressLabel('Loading language data...');
          }
          console.log(m); // Log Tesseract.js progress
        },
      });

      const { data: { text } } = await worker.recognize(imageFileRef.current);
      setExtractedText(text);
      setProgress(100);
      setProgressLabel('Done!');

      await worker.terminate(); // Important: terminate the worker to free up resources

    } catch (err: any) {
      console.error('OCR Error:', err);
      setError(`Failed to extract text: ${err.message || 'An unknown error occurred.'}`);
      setExtractedText(''); // Clear any previous text on error
      setProgress(0);
      setProgressLabel('Error');
    } finally {
      setLoading(false);
    }
  };

  // Clean up the object URL when the component unmounts or image changes
  useEffect(() => {
    return () => {
      if (selectedImage) {
        URL.revokeObjectURL(selectedImage);
      }
    };
  }, [selectedImage]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-800 mb-8 text-center leading-tight">
        Image to Text Converter
      </h1>

      <div className="bg-white p-6 sm:p-10 rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200">
        <div className="mb-8">
          <label htmlFor="image-upload" className="block text-lg font-semibold text-gray-700 mb-3 cursor-pointer">
            <div className="flex items-center justify-center w-full px-5 py-3 border-2 border-dashed border-blue-400 rounded-lg text-blue-700 hover:bg-blue-50 transition duration-200 ease-in-out">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
              Click to Upload Image or Drag & Drop
            </div>
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden" // Hide the default input
          />
        </div>

        {selectedImage && (
          <div className="mb-8 flex justify-center items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <Image
              src={selectedImage}
              alt="Selected Preview"
              width={400}
              height={400}
              objectFit="contain" // Keep aspect ratio
              className="max-h-96 w-auto rounded-md shadow-inner"
            />
          </div>
        )}

        <button
          onClick={processImage}
          disabled={!imageFileRef.current || loading}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-800 text-white py-4 px-6 rounded-lg font-bold text-xl
                     hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-offset-2 transition duration-300 ease-in-out
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-600"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {progressLabel} ({progress}%)
            </div>
          ) : 'Convert Image to Text'}
        </button>

        {error && (
          <p className="mt-6 text-red-600 bg-red-50 p-4 rounded-md border border-red-200 text-center text-md font-medium">
            {error}
          </p>
        )}

        {extractedText && (
          <div className="mt-8 bg-gray-50 p-6 rounded-lg border border-gray-200 shadow-inner">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">Extracted Text:</h2>
            <textarea
              readOnly
              value={extractedText}
              className="w-full h-64 p-4 text-gray-800 bg-white border border-gray-300 rounded-md
                         focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm"
              placeholder="Extracted text will appear here..."
            />
             <button
              onClick={() => navigator.clipboard.writeText(extractedText)}
              className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md font-semibold text-md
                         hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Copy Text
            </button>
          </div>
        )}
      </div>
    </div>
  );
}