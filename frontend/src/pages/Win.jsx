import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ConnectorHeader, ConnectorFooter } from "../components/ConnectorLayout";
import ConnieFloating from "../components/ConnieFloating";
import { CheckCircle, XCircle, Share2, Trophy, ArrowRight } from "lucide-react";

// Brand colors
const coral = "#FF4F64";
const mint = "#30E0B2";
const charcoal = "#0E1514";

const Win = () => {
  const [polls, setPolls] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votedPolls, setVotedPolls] = useState({});
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizResult, setQuizResult] = useState(null);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://connector-hub-2.preview.emergentagent.com";
      
      const [pollsRes, quizzesRes] = await Promise.all([
        fetch(`${backendUrl}/api/win/polls`),
        fetch(`${backendUrl}/api/win/quizzes`)
      ]);

      const pollsData = await pollsRes.json();
      const quizzesData = await quizzesRes.json();

      setPolls(pollsData);
      setQuizzes(quizzesData);
    } catch (error) {
      console.error("Error fetching Win content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionId) => {
    if (votedPolls[pollId]) return;

    try {
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/win/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poll_id: pollId, option_id: optionId })
      });

      const updatedPoll = await response.json();
      setPolls(polls.map(p => p.id === pollId ? updatedPoll : p));
      setVotedPolls({ ...votedPolls, [pollId]: optionId });
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestion(0);
    setQuizAnswers([]);
    setQuizResult(null);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const selectAnswer = (answer) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
  };

  const submitAnswer = () => {
    if (!selectedAnswer) return;
    setShowFeedback(true);
    setQuizAnswers([...quizAnswers, selectedAnswer]);

    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (currentQuestion < activeQuiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        // Quiz complete, submit for results
        submitQuiz([...quizAnswers, selectedAnswer]);
      }
    }, 2000);
  };

  const submitQuiz = async (answers) => {
    try {
      const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/win/quizzes/${activeQuiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quiz_id: activeQuiz.id, answers })
      });

      const result = await response.json();
      setQuizResult(result);
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };

  const exitQuiz = () => {
    setActiveQuiz(null);
    setQuizResult(null);
    setCurrentQuestion(0);
    setQuizAnswers([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
  };

  const getResultMessage = (score, total) => {
    if (score === total) return { emoji: "🔥", text: "YOU'RE ON FIRE!", subtext: "Basically, you're the friend everyone calls during trivia night." };
    if (score >= total * 0.6) return { emoji: "💪", text: "NOT BAD AT ALL!", subtext: "You're getting with it. Just need to scroll a bit more. 😉" };
    return { emoji: "😅", text: "OKAY, HEAR US OUT...", subtext: "Hey, at least you're honest. Time to binge some shows?" };
  };

  // Full-screen Quiz Mode
  if (activeQuiz && !quizResult) {
    const question = activeQuiz.questions[currentQuestion];
    const isCorrect = showFeedback && selectedAnswer === question.correct_answer;
    const progress = ((currentQuestion + 1) / activeQuiz.questions.length) * 100;

    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: charcoal }}>
        <div className="w-full max-w-2xl px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <button onClick={exitQuiz} className="text-white text-sm hover:opacity-70">
              ← Exit
            </button>
            <span className="text-gray-400 text-sm">
              Question {currentQuestion + 1}/{activeQuiz.questions.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/10 rounded-full mb-8">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: coral }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Question */}
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-12 leading-tight">
            {question.question}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-8">
            {question.options.map((option, idx) => {
              const isSelected = selectedAnswer === option;
              const isCorrectAnswer = option === question.correct_answer;
              const showCorrect = showFeedback && isCorrectAnswer;
              const showIncorrect = showFeedback && isSelected && !isCorrect;

              return (
                <motion.button
                  key={option}
                  onClick={() => selectAnswer(option)}
                  disabled={showFeedback}
                  className="w-full p-4 rounded-xl text-left transition-all text-white"
                  style={{
                    backgroundColor: showCorrect ? mint : showIncorrect ? `${coral}80` : isSelected ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    border: `2px solid ${showCorrect ? mint : showIncorrect ? coral : isSelected ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
                    opacity: showFeedback && !showCorrect && !showIncorrect ? 0.4 : 1
                  }}
                  whileHover={!showFeedback ? { scale: 1.02 } : {}}
                  whileTap={!showFeedback ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{question.option_texts[idx]}</span>
                    {showCorrect && <CheckCircle className="w-6 h-6" style={{ color: charcoal }} />}
                    {showIncorrect && <XCircle className="w-6 h-6" style={{ color: charcoal }} />}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Feedback & Next Button */}
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <p className="text-white text-lg mb-4">
                {isCorrect ? question.explanation_correct : question.explanation_incorrect}
              </p>
            </motion.div>
          )}

          {!showFeedback && selectedAnswer && (
            <motion.button
              onClick={submitAnswer}
              className="w-full py-3 rounded-full text-white font-semibold"
              style={{ background: `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {currentQuestion < activeQuiz.questions.length - 1 ? "Next Question" : "See Results"} →
            </motion.button>
          )}
        </div>
      </div>
    );
  }

  // Quiz Results Screen
  if (quizResult) {
    const resultMsg = getResultMessage(quizResult.score, quizResult.total);
    const stars = "⭐".repeat(quizResult.score) + "☆".repeat(quizResult.total - quizResult.score);

    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: charcoal }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-6xl mb-4"
          >
            <Trophy className="w-20 h-20 mx-auto" style={{ color: coral }} />
          </motion.div>

          <h1 className="text-3xl font-bold text-white mb-2">{resultMsg.emoji} {resultMsg.text}</h1>
          <p className="text-5xl font-bold text-white mb-4">
            {quizResult.score}/{quizResult.total}
          </p>
          <p className="text-2xl mb-4">{stars}</p>
          <p className="text-lg mb-8" style={{ color: mint }}>
            You're in the top {quizResult.percentile}% of players today!
          </p>
          <p className="text-gray-400 mb-8">{resultMsg.subtext}</p>

          <div className="space-y-3">
            <button
              className="w-full py-3 rounded-full text-white font-semibold"
              style={{ background: `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)` }}
            >
              <Share2 className="inline w-5 h-5 mr-2" />
              Share Your Victory
            </button>
            <button
              onClick={exitQuiz}
              className="w-full py-3 rounded-full text-white font-semibold"
              style={{ border: `2px solid ${mint}`, backgroundColor: 'transparent' }}
            >
              Back to Win
            </button>
          </div>

          {/* Breakdown */}
          <div className="mt-8 text-left">
            <h3 className="text-white font-semibold mb-3">Breakdown:</h3>
            {activeQuiz.questions.map((q, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                {quizResult.correct_answers[idx] ? (
                  <CheckCircle className="w-5 h-5" style={{ color: mint }} />
                ) : (
                  <XCircle className="w-5 h-5" style={{ color: coral }} />
                )}
                <span className="text-gray-400 text-sm">
                  Question {idx + 1}: {quizResult.correct_answers[idx] ? "Correct" : "Incorrect"}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Win Page
  return (
    <>
      <ConnectorHeader />
      <div className="min-h-screen" style={{ backgroundColor: charcoal }}>
        {/* Header */}
        <div className="px-3 md:px-6 pt-4 md:pt-6 pb-3 md:pb-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-2">
              Win
            </h1>
            <p className="text-sm md:text-base" style={{ color: coral }}>
              Compete. Vote. Play.
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 md:px-6 py-4">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/5 rounded-2xl h-32 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                {/* Polls Section */}
                {polls.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      🔥 Active Polls
                    </h2>
                    <div className="space-y-4">
                      {polls.map((poll) => (
                        <PollCard
                          key={poll.id}
                          poll={poll}
                          voted={votedPolls[poll.id]}
                          onVote={handleVote}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Quizzes Section */}
                {quizzes.length > 0 && (
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      🏆 Daily Challenges
                    </h2>
                    <div className="space-y-4">
                      {quizzes.map((quiz) => (
                        <QuizCard key={quiz.id} quiz={quiz} onStart={() => startQuiz(quiz)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <ConnectorFooter />
      <ConnieFloating offsetPx={140} />
    </>
  );
};

// Poll Card Component
const PollCard = ({ poll, voted, onVote }) => {
  const hasVoted = !!voted;
  const totalVotes = poll.total_votes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-2xl p-6 border border-white/10"
    >
      <h3 className="text-lg md:text-xl font-bold text-white mb-2">{poll.question}</h3>
      {poll.description && (
        <p className="text-sm text-gray-400 mb-4">{poll.description}</p>
      )}

      <div className="space-y-3">
        {poll.options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const isSelected = voted === option.id;

          return (
            <button
              key={option.id}
              onClick={() => !hasVoted && onVote(poll.id, option.id)}
              disabled={hasVoted}
              className="w-full text-left relative overflow-hidden rounded-xl p-4 transition-all"
              style={{
                backgroundColor: hasVoted ? (isSelected ? `${coral}20` : 'rgba(255, 255, 255, 0.05)') : 'rgba(255, 255, 255, 0.05)',
                border: `2px solid ${isSelected ? coral : 'rgba(255, 255, 255, 0.1)'}`,
                cursor: hasVoted ? 'default' : 'pointer'
              }}
            >
              {hasVoted && (
                <motion.div
                  className="absolute inset-0 h-full rounded-xl"
                  style={{ backgroundColor: `${mint}30`, width: `${percentage}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              )}
              <div className="relative flex justify-between items-center">
                <span className="text-white font-medium">{option.text}</span>
                {hasVoted && <span className="text-white font-bold">{percentage}%</span>}
              </div>
            </button>
          );
        })}
      </div>

      {hasVoted && (
        <p className="text-xs mt-4" style={{ color: mint }}>
          {totalVotes.toLocaleString()} {totalVotes === 1 ? 'person' : 'people'} voted
          {poll.ends_at && ` • Ends in ${Math.ceil((new Date(poll.ends_at) - new Date()) / (1000 * 60 * 60 * 24))} days`}
        </p>
      )}
      {!hasVoted && (
        <p className="text-xs text-gray-400 mt-4">
          Vote to see results
          {poll.ends_at && ` • Ends in ${Math.ceil((new Date(poll.ends_at) - new Date()) / (1000 * 60 * 60 * 24))} days`}
        </p>
      )}
    </motion.div>
  );
};

// Quiz Card Component
const QuizCard = ({ quiz, onStart }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 rounded-2xl p-6 border border-white/10"
    >
      <h3 className="text-lg md:text-xl font-bold text-white mb-2">{quiz.title}</h3>
      <p className="text-sm text-gray-400 mb-4">{quiz.description}</p>

      <div className="flex items-center gap-4 text-sm text-gray-400 mb-6">
        <span>{quiz.questions.length} Questions</span>
        <span>•</span>
        <span>2 min</span>
        {quiz.total_attempts > 0 && (
          <>
            <span>•</span>
            <span className="flex items-center gap-1">
              🔥 {quiz.total_attempts} played today
            </span>
          </>
        )}
      </div>

      <button
        onClick={onStart}
        className="w-full py-3 rounded-full text-white font-semibold flex items-center justify-center gap-2"
        style={{ background: `linear-gradient(135deg, ${coral} 0%, ${mint} 100%)` }}
      >
        Start Challenge
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
};

export default Win;
