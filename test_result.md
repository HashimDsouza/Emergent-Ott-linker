#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Fix content metadata accuracy issues:
  1. IMDb ratings are inaccurate (showing TMDB ratings instead of actual IMDb scores from OMDb)
  2. Wrong metadata capsule (episodes, year of release, and language details are incorrect)
  3. Wrong title images for duplicate names (e.g., "Fighter" pulling international movie instead of Hindi version)
  4. Season specificity issues (Season 2 showing Season 1 data)

frontend:
  - task: "Remove permanently visible logo tooltip"
    implemented: true
    working: true
    file: "/app/frontend/src/components/ConnectorLayout.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Fixed logo tooltip to only show on hover/group-hover. Changed from always-visible <Tip> to conditional display with hidden class + group-hover:block. Logo tooltip no longer permanently visible."

  - task: "Add tooltips to Line 2 and Footer elements"
    implemented: true
    working: true
    file: "/app/frontend/src/components/ConnectorLayout.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Added tooltip support to all missing elements: Game On, Entertainment, Lang (Language Dropdown), Home, Dive In, Crew, Get With It. All tooltips now functional on hover."

  - task: "Connie button positioning to avoid footer overlap"
    implemented: true
    working: true
    file: "/app/frontend/src/components/ConnectorLayout.jsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Changed Connie button positioning from fixed bottom-16 to calculated bottom: calc(56px + 16px) to sit above footer (56px footer height + 16px margin). Connie now properly positioned above footer on mobile without overlapping 'Get With It'."

  - task: "Mobile tooltip system with long-press"
    implemented: true
    working: true
    file: "/app/frontend/src/components/ConnectorLayout.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Implemented long-press tooltip system for mobile. Added onTouchStart/onTouchEnd handlers with 500ms delay. Tooltips show for 2 seconds on long-press. Enhanced Chip, LanguageDropdown, and NavItem components with mobile tooltip support using React.useRef for timer management."

  - task: "Tooltip component enhancement"
    implemented: true
    working: true
    file: "/app/frontend/src/components/ConnectorLayout.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Updated Tip component with opacity-0 + group-hover:opacity-100 for smooth transitions. Tooltips now use CSS transitions for better UX."

metadata:
  created_by: "main_agent"
  version: "3.0"
  test_sequence: 3
  run_ui: false

test_plan:
  current_focus:
    - "Verify logo tooltip only shows on hover"
    - "Confirm all Line 2 and Footer tooltips are functional"
    - "Test Connie button positioning on mobile (no overlap)"
    - "Test long-press tooltip behavior on mobile devices"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "Fixed all reported mobile issues: 1) Logo tooltip no longer permanently visible, 2) Added all missing tooltips to Game On, Entertainment, Lang, Home, Dive In, Crew, Get With It, 3) Connie button repositioned to sit above footer without overlapping, 4) Implemented long-press tooltip system for mobile. Desktop tooltips work on hover, mobile tooltips appear on 500ms long-press and auto-hide after 2s."