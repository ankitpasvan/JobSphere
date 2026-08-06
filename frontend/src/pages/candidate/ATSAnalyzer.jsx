import { useState } from 'react';
import { atsAPI } from '../../services/api';
import { FiUpload, FiBriefcase, FiCheckCircle, FiXCircle, FiAlertCircle, FiFileText } from 'react-icons/fi';

const ATSAnalyzer = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    setError('');
    setResult(null);

    if (!selectedFile) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('resumeFile', selectedFile);
      if (jobDescription.trim()) {
        formData.append('jobDescription', jobDescription.trim());
      }
      
      const response = await atsAPI.analyzeFile(formData);
      setResult(response.data);
    } catch (err) {
      console.error('ATS Analysis Error:', err);
      console.error('Error response:', err.response?.data);
      
      // User-friendly error messages
      if (err.response?.status === 404) {
        setError('Resume analysis service is temporarily unavailable. Please try again later.');
      } else if (err.response?.status === 400) {
        // Show the actual error message from backend
        const backendMessage = err.response?.data?.message;
        setError(backendMessage || 'Unable to read your resume. Please make sure it\'s a valid PDF file.');
      } else if (err.response?.status === 413) {
        setError('Your resume file is too large. Please use a file smaller than 5MB.');
      } else if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
        setError('Connection timeout. Please check your internet connection and try again.');
      } else {
        setError('Something went wrong while analyzing your resume. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-blue-50 border-blue-200';
    if (score >= 40) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div>
      <div className="max-w-5xl mx-auto">
        
        {/* Header - Simplified as DashboardHeader provides title */}
        <div className="text-center mb-12">
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your resume and get instant feedback on how well it matches with Applicant Tracking Systems
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            
            {/* Upload Section */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Upload Resume (PDF)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="resume-upload"
                />
                <label htmlFor="resume-upload" className="cursor-pointer">
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FiCheckCircle className="text-3xl text-green-600" />
                      <div className="text-left">
                        <p className="text-gray-900 font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <FiUpload className="text-5xl text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium mb-1">
                        Click to upload your resume
                      </p>
                      <p className="text-sm text-gray-500">PDF format, max 5MB</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Job Description Section */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FiBriefcase className="text-gray-500" />
                Job Description (Optional)
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Paste a job description to get targeted analysis, or leave empty for general resume feedback
              </p>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here...&#10;&#10;Example:&#10;We are looking for a Senior Software Engineer with 5+ years of experience in React, Node.js, and cloud technologies..."
                className="w-full h-40 border border-gray-300 rounded-lg p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || !selectedFile}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Analyzing your resume...
                </span>
              ) : (
                'Analyze Resume'
              )}
            </button>
          </div>

          {/* Results Section */}
          {result && (
            <div className="border-t border-gray-200 bg-gray-50 p-8">
              
              {/* Score Display */}
              <div className={`rounded-lg border-2 p-6 mb-6 ${getScoreBg(result.atsScore)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 uppercase mb-1">
                      ATS Score
                    </p>
                    <p className={`text-5xl font-bold ${getScoreColor(result.atsScore)}`}>
                      {result.atsScore}/100
                    </p>
                    <p className={`text-lg font-semibold mt-1 ${getScoreColor(result.atsScore)}`}>
                      {getScoreLabel(result.atsScore)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block bg-white px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-300">
                      {result.mode === 'job-based' ? '🎯 Job-Based Analysis' : '📊 General Analysis'}
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-4 w-full bg-white rounded-full h-3">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      result.atsScore >= 80 ? 'bg-green-600' :
                      result.atsScore >= 60 ? 'bg-blue-600' :
                      result.atsScore >= 40 ? 'bg-orange-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${result.atsScore}%` }}
                  ></div>
                </div>
              </div>

              {/* Keywords (Job-Based Only) */}
              {result.mode === 'job-based' && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Keyword Match Analysis
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Matched */}
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                        <FiCheckCircle />
                        Matched Keywords ({result.keywordAnalysis.matchedKeywords.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.keywordAnalysis.matchedKeywords.length > 0 ? (
                          result.keywordAnalysis.matchedKeywords.map((kw, i) => (
                            <span key={i} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                              {kw}
                            </span>
                          ))
                        ) : (
                          <p className="text-gray-500 italic text-sm">No keywords matched</p>
                        )}
                      </div>
                    </div>

                    {/* Missing */}
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-2">
                        <FiXCircle />
                        Missing Keywords ({result.keywordAnalysis.missingKeywords.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.keywordAnalysis.missingKeywords.length > 0 ? (
                          result.keywordAnalysis.missingKeywords.slice(0, 15).map((kw, i) => (
                            <span key={i} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                              {kw}
                            </span>
                          ))
                        ) : (
                          <p className="text-green-600 italic text-sm">All keywords present!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Analysis */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Resume Sections
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(result.sectionAnalysis).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      {value ? (
                        <FiCheckCircle className="text-green-600" />
                      ) : (
                        <FiXCircle className="text-red-600" />
                      )}
                      <span className="text-gray-700 text-sm">
                        {key.replace('has', '')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Issues */}
              {result.issues.length > 0 && (
                <div className="bg-red-50 rounded-lg border border-red-200 p-6 mb-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
                    <FiAlertCircle />
                    Issues Found
                  </h3>
                  <ul className="space-y-2">
                    {result.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-red-800 flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions.length > 0 && (
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <FiFileText />
                    Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {result.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-blue-800 flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Info Note */}
        {!result && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Upload your resume to get started. Add a job description for targeted feedback.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ATSAnalyzer;

