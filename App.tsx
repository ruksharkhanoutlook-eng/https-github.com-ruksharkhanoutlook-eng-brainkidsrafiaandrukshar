import React, { useState, useEffect, useRef } from 'react';
import { ViewState, Subject, User, LessonContent, Question } from './types';
import { generateLesson } from './services/geminiService';
import { Button } from './components/Button';

// --- SVGs ---
const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-accent-yellow">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.005Z" clipRule="evenodd" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

// --- Sub-Components ---

const Layout: React.FC<{ 
  user: User | null, 
  onLogout: () => void, 
  children: React.ReactNode,
  showNav?: boolean
}> = ({ user, onLogout, children, showNav = true }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-brand-200 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-purple/20 rounded-full blur-3xl opacity-30 translate-x-1/3 translate-y-1/3"></div>

      {showNav && (
        <nav className="z-10 bg-white/80 backdrop-blur-md border-b border-brand-100 px-6 py-4 flex justify-between items-center sticky top-0">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 text-white p-2 rounded-lg font-bold text-xl">BK</div>
            <span className="font-bold text-brand-900 text-xl tracking-tight">BrainKey<span className="text-brand-500">Academy</span></span>
          </div>
          {user && (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-yellow-100 px-4 py-1.5 rounded-full border border-yellow-200">
                <StarIcon />
                <span className="font-bold text-yellow-700">{user.stars}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-700">{user.username}</p>
                  <p className="text-xs text-slate-500">Grade {user.gradeLevel}</p>
                </div>
                <div className="bg-brand-100 p-1 rounded-full text-brand-600">
                  <UserIcon />
                </div>
                <button onClick={onLogout} className="text-sm text-red-500 hover:underline font-medium ml-2">Log Out</button>
              </div>
            </div>
          )}
        </nav>
      )}
      <main className="flex-1 overflow-y-auto z-0 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
};

const SubjectCard: React.FC<{ subject: Subject, onClick: () => void, icon: string, color: string }> = ({ subject, onClick, icon, color }) => (
  <button 
    onClick={onClick}
    className={`group relative overflow-hidden p-6 rounded-3xl bg-white border-2 border-transparent hover:border-${color}-400 shadow-xl hover:shadow-2xl transition-all duration-300 text-left flex flex-col justify-between h-48 w-full`}
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-100 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-110`}></div>
    <div className="relative z-10">
      <div className={`text-4xl mb-4 p-3 rounded-2xl bg-${color}-50 w-fit text-${color}-600`}>{icon}</div>
      <h3 className="text-2xl font-bold text-slate-800">{subject}</h3>
      <p className="text-slate-500 text-sm mt-1">Tap to start learning</p>
    </div>
  </button>
);

const ActivityEngine: React.FC<{ 
  lesson: LessonContent, 
  onComplete: (score: number) => void,
  onBack: () => void 
}> = ({ lesson, onComplete, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error' | 'neutral'} | null>(null);
  const [score, setScore] = useState(0);
  
  // WPM State
  const [startTime, setStartTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);

  const currentQ = lesson.questions[currentIndex];
  const isLast = currentIndex === lesson.questions.length - 1;

  useEffect(() => {
    setUserInput("");
    setFeedback(null);
    setStartTime(null);
    setWpm(0);
  }, [currentIndex]);

  const handleTypingInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!startTime) setStartTime(Date.now());
    const val = e.target.value;
    setUserInput(val);

    // Calculate WPM roughly
    if (startTime) {
      const timeInMin = (Date.now() - startTime) / 60000;
      const words = val.trim().split(/\s+/).length;
      setWpm(Math.round(words / (timeInMin || 0.01)));
    }
  };

  const checkAnswer = () => {
    if (currentQ.type === 'quiz') {
      if (userInput === currentQ.correctAnswer) {
        setFeedback({ msg: "Correct! Amazing job!", type: 'success' });
        setScore(s => s + 10);
        setTimeout(nextQuestion, 1500);
      } else {
        setFeedback({ msg: "Oops! Try again.", type: 'error' });
      }
    } else {
      // Typing mode
      const target = currentQ.typingText || "";
      if (userInput.trim() === target.trim()) {
        setFeedback({ msg: `Perfect! Speed: ${wpm} WPM`, type: 'success' });
        setScore(s => s + 20); // More points for typing
        setTimeout(nextQuestion, 2000);
      } else {
        // Simple validation: check if it matches so far or if they are done
        // We'll just check exact match on submit for simplicity in this demo
        if (userInput.length < target.length) {
           setFeedback({ msg: "Keep typing...", type: 'neutral' });
        } else {
           setFeedback({ msg: "Check your spelling and punctuation!", type: 'error' });
        }
      }
    }
  };

  const nextQuestion = () => {
    if (isLast) {
      onComplete(score);
    } else {
      setCurrentIndex(c => c + 1);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-slate-500 hover:text-brand-600 font-medium">← Exit Lesson</button>
        <div className="h-2 flex-1 mx-8 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand-500 transition-all duration-500" 
            style={{ width: `${((currentIndex) / lesson.questions.length) * 100}%` }}
          ></div>
        </div>
        <div className="font-bold text-brand-600">Q {currentIndex + 1}/{lesson.questions.length}</div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 flex-1 flex flex-col animate-float" style={{ animationDuration: '0s' }}> 
        {/* Content Area */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">{currentQ.type === 'typing' ? 'Type This:' : 'Question:'}</h2>
          <p className="text-xl text-slate-600 leading-relaxed">{currentQ.prompt}</p>
        </div>

        {/* Interaction Area */}
        <div className="flex-1">
          {currentQ.type === 'quiz' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQ.options?.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setUserInput(opt)}
                  className={`p-6 text-lg rounded-2xl border-2 transition-all text-left font-medium
                    ${userInput === opt 
                      ? 'border-brand-500 bg-brand-50 text-brand-700' 
                      : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50 text-slate-700'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
               <div className="p-6 bg-slate-100 rounded-xl font-mono text-lg text-slate-700 border-l-4 border-brand-500 select-none">
                 {currentQ.typingText}
               </div>
               <textarea
                value={userInput}
                onChange={handleTypingInput}
                placeholder="Start typing here..."
                className="w-full p-6 text-lg font-mono rounded-xl border-2 border-slate-200 focus:border-brand-500 focus:ring-0 outline-none min-h-[150px] resize-none"
                spellCheck={false}
                autoFocus
               />
               <div className="text-right text-sm text-slate-400 font-mono">
                 {userInput.length} / {currentQ.typingText?.length} chars | {wpm} WPM
               </div>
            </div>
          )}
        </div>

        {/* Feedback & Actions */}
        <div className="mt-8 flex justify-between items-center">
          <div className={`text-lg font-bold ${
            feedback?.type === 'success' ? 'text-green-600' : 
            feedback?.type === 'error' ? 'text-red-500' : 'text-slate-400'
          }`}>
            {feedback?.msg}
          </div>
          <Button onClick={checkAnswer} size="lg" disabled={!userInput}>
            {isLast && feedback?.type === 'success' ? 'Finish' : 'Submit'}
          </Button>
        </div>
      </div>
    </div>
  );
};


// --- Main App Component ---

export default function App() {
  const [view, setView] = useState<ViewState>(ViewState.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  
  // Lesson Data
  const [loading, setLoading] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<LessonContent | null>(null);

  // Auth Inputs
  const [loginName, setLoginName] = useState("");
  const [loginGrade, setLoginGrade] = useState("1");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName) return;
    setUser({
      username: loginName,
      gradeLevel: parseInt(loginGrade),
      stars: 0
    });
    setSelectedLevel(parseInt(loginGrade));
    setView(ViewState.DASHBOARD);
  };

  const startLesson = async (subject: Subject) => {
    setSelectedSubject(subject);
    setLoading(true);
    setView(ViewState.ACTIVITY);
    
    try {
      const lesson = await generateLesson(selectedLevel, subject);
      setCurrentLesson(lesson);
    } catch (e) {
      alert("Failed to load lesson. Please try again.");
      setView(ViewState.DASHBOARD);
    } finally {
      setLoading(false);
    }
  };

  const handleLessonComplete = (score: number) => {
    if (user) {
      setUser({ ...user, stars: user.stars + score });
    }
    setView(ViewState.DASHBOARD);
    setSelectedSubject(null);
    setCurrentLesson(null);
  };

  // --- Views ---

  if (view === ViewState.LANDING) {
    return (
      <Layout user={null} onLogout={() => {}} showNav={false}>
        <div className="h-full flex flex-col items-center justify-center text-center relative z-10">
          <div className="animate-float">
            <h1 className="text-6xl md:text-8xl font-black text-brand-900 mb-6 tracking-tight">
              BrainKey<span className="text-brand-500">.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-2xl mx-auto">
              The ultimate fusion of typing skills and academic mastery. 
              Learn Math, English, and AI while typing your way to success!
            </p>
          </div>
          <div className="flex gap-4">
             <Button size="lg" onClick={() => setView(ViewState.LOGIN)}>
               Get Started
             </Button>
          </div>
          {/* Decorative Icons Grid Background */}
          <div className="absolute inset-0 -z-10 opacity-5 grid grid-cols-6 gap-4 pointer-events-none">
             {Array.from({length: 24}).map((_,i) => (
               <div key={i} className="text-4xl text-brand-900">
                 {['A', '1', '{', '}', '+', '?'][i%6]}
               </div>
             ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (view === ViewState.LOGIN) {
    return (
      <Layout user={null} onLogout={() => {}} showNav={true}>
        <div className="flex items-center justify-center h-full">
          <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md border border-brand-100">
            <h2 className="text-3xl font-bold text-center text-brand-900 mb-8">Student Login</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Your Name</label>
                <input 
                  type="text" 
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none text-lg"
                  placeholder="e.g. Alex"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Grade Level (1-10)</label>
                <select 
                  value={loginGrade}
                  onChange={(e) => setLoginGrade(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-brand-500 outline-none text-lg bg-white"
                >
                  {Array.from({length: 10}, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>Grade {num}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full justify-center" size="lg">
                Enter Academy
              </Button>
            </form>
            <button 
              onClick={() => setView(ViewState.LANDING)}
              className="w-full text-center mt-6 text-slate-400 hover:text-brand-600 text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (view === ViewState.DASHBOARD) {
    return (
      <Layout user={user} onLogout={() => setView(ViewState.LANDING)}>
        <div className="space-y-8">
          
          {/* Level Selector */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider mb-4">Select Level</h3>
             <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
               {Array.from({length: 10}, (_, i) => i + 1).map(level => (
                 <button
                   key={level}
                   onClick={() => setSelectedLevel(level)}
                   className={`w-12 h-12 flex-shrink-0 rounded-full font-bold text-lg flex items-center justify-center transition-all
                     ${selectedLevel === level 
                       ? 'bg-brand-600 text-white scale-110 shadow-lg shadow-brand-500/40' 
                       : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                 >
                   {level}
                 </button>
               ))}
             </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800">What do you want to learn?</h2>
            <p className="text-slate-500">Choose a subject to start your mission.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <SubjectCard 
              subject={Subject.MATH} 
              onClick={() => startLesson(Subject.MATH)}
              icon="🧮"
              color="blue"
            />
            <SubjectCard 
              subject={Subject.ENGLISH} 
              onClick={() => startLesson(Subject.ENGLISH)}
              icon="📝"
              color="orange"
            />
            <SubjectCard 
              subject={Subject.COMPUTER} 
              onClick={() => startLesson(Subject.COMPUTER)}
              icon="💻"
              color="green"
            />
            <SubjectCard 
              subject={Subject.AI_TECH} 
              onClick={() => startLesson(Subject.AI_TECH)}
              icon="🤖"
              color="purple"
            />
          </div>
        </div>
      </Layout>
    );
  }

  if (view === ViewState.ACTIVITY) {
    return (
      <Layout user={user} onLogout={() => setView(ViewState.LANDING)}>
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center">
             <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
             <h3 className="text-2xl font-bold text-brand-900">Generating Lesson...</h3>
             <p className="text-slate-500">Our AI Brain is crafting questions for Grade {selectedLevel} {selectedSubject}</p>
          </div>
        ) : currentLesson ? (
          <ActivityEngine 
            lesson={currentLesson}
            onBack={() => setView(ViewState.DASHBOARD)}
            onComplete={handleLessonComplete}
          />
        ) : (
          <div className="text-center pt-20">
             <h3 className="text-xl text-red-500 mb-4">Something went wrong loading the lesson.</h3>
             <Button onClick={() => setView(ViewState.DASHBOARD)}>Return Home</Button>
          </div>
        )}
      </Layout>
    );
  }

  return null;
}