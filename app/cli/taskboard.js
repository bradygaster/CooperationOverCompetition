#!/usr/bin/env node

const BASE_URL = process.env.TASKBOARD_URL || 'http://localhost:3000';

// --- Argument parsing ---

const args = process.argv.slice(2);
const command = args[0] || 'help';

function parseFlags(args) {
  const flags = {};
  const positional = [];
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, ...rest] = arg.slice(2).split('=');
      flags[key] = rest.join('=') || true;
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

const { flags, positional } = parseFlags(args.slice(1));

// --- Formatting helpers ---

function pad(str, len) {
  str = String(str);
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}

function statusBadge(status) {
  const badges = {
    'todo':        '[ TODO ]      ',
    'in-progress': '[ IN-PROGRESS ]',
    'done':        '[ DONE ]      ',
  };
  return badges[status] || `[ ${status} ]`;
}

function printTask(task) {
  console.log('');
  console.log(`  ID:          ${task.id}`);
  console.log(`  Title:       ${task.title}`);
  console.log(`  Description: ${task.description || '(none)'}`);
  console.log(`  Status:      ${statusBadge(task.status).trim()}`);
  console.log(`  Created:     ${task.created_at}`);
  console.log(`  Updated:     ${task.updated_at}`);
  console.log('');
}

function printTable(tasks) {
  if (tasks.length === 0) {
    console.log('\n  No tasks found.\n');
    return;
  }

  const header = `  ${pad('ID', 5)} ${pad('Status', 13)} ${pad('Title', 40)} Created`;
  const divider = '  ' + '-'.repeat(header.length);

  console.log('');
  console.log(header);
  console.log(divider);

  for (const t of tasks) {
    const row = `  ${pad(t.id, 5)} ${pad(t.status, 13)} ${pad(t.title, 40)} ${t.created_at}`;
    console.log(row);
  }

  console.log(`\n  ${tasks.length} task(s)\n`);
}

// --- HTTP helpers ---

async function request(method, path, body) {
  const url = `${BASE_URL}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(url, opts);
    const data = await res.json();

    if (!res.ok) {
      const msg = data.error || `HTTP ${res.status}`;
      console.error(`\n  Error: ${msg}\n`);
      process.exit(1);
    }
    return data;
  } catch (err) {
    if (err.cause && (err.cause.code === 'ECONNREFUSED' || err.cause.code === 'UND_ERR_CONNECT_TIMEOUT')) {
      console.error('\n  Could not connect to the Task Board API.');
      console.error(`  Is the server running? Start with: npm start\n`);
    } else {
      console.error(`\n  Request failed: ${err.message}\n`);
    }
    process.exit(1);
  }
}

// --- Commands ---

async function listTasks() {
  const tasks = await request('GET', '/tasks');
  const statusFilter = flags.status;
  const filtered = statusFilter
    ? tasks.filter(t => t.status === statusFilter)
    : tasks;
  printTable(filtered);
}

async function getTask() {
  const id = positional[0];
  if (!id) {
    console.error('\n  Usage: taskboard get <id>\n');
    process.exit(1);
  }
  const task = await request('GET', `/tasks/${id}`);
  printTask(task);
}

async function addTask() {
  const title = positional[0];
  const description = positional[1] || '';
  if (!title) {
    console.error('\n  Usage: taskboard add "title" "description"\n');
    process.exit(1);
  }
  const task = await request('POST', '/tasks', { title, description });
  console.log(`\n  Created task #${task.id}`);
  printTask(task);
}

async function updateTask() {
  const id = positional[0];
  if (!id) {
    console.error('\n  Usage: taskboard update <id> --title="new title" --description="new desc"\n');
    process.exit(1);
  }
  const body = {};
  if (flags.title) body.title = flags.title;
  if (flags.description) body.description = flags.description;
  if (flags.status) body.status = flags.status;

  if (Object.keys(body).length === 0) {
    console.error('\n  Nothing to update. Use --title, --description, or --status.\n');
    process.exit(1);
  }

  const task = await request('PATCH', `/tasks/${id}`, body);
  console.log(`\n  Updated task #${task.id}`);
  printTask(task);
}

async function startTask() {
  const id = positional[0];
  if (!id) {
    console.error('\n  Usage: taskboard start <id>\n');
    process.exit(1);
  }
  const task = await request('PATCH', `/tasks/${id}`, { status: 'in-progress' });
  console.log(`\n  Task #${task.id} is now in-progress`);
  printTask(task);
}

async function doneTask() {
  const id = positional[0];
  if (!id) {
    console.error('\n  Usage: taskboard done <id>\n');
    process.exit(1);
  }
  const task = await request('PATCH', `/tasks/${id}`, { status: 'done' });
  console.log(`\n  Task #${task.id} is now done`);
  printTask(task);
}

async function deleteTask() {
  const id = positional[0];
  if (!id) {
    console.error('\n  Usage: taskboard delete <id>\n');
    process.exit(1);
  }
  const task = await request('DELETE', `/tasks/${id}`);
  console.log(`\n  Deleted task #${task.id}: ${task.title}\n`);
}

function showHelp() {
  console.log(`
  Task Board CLI — manage tasks from the command line

  Usage: taskboard <command> [options]

  Commands:
    list [--status=todo|in-progress|done]   List all tasks (optionally filter by status)
    get <id>                                Show details for a single task
    add "title" ["description"]             Create a new task
    update <id> [--title=...] [--desc=...]  Update a task's title or description
    start <id>                              Move a task to in-progress
    done <id>                               Move a task to done
    delete <id>                             Delete a task
    help                                    Show this help message

  Environment:
    TASKBOARD_URL   API base URL (default: http://localhost:3000)

  Examples:
    taskboard add "Fix login bug" "Users can't log in on Safari"
    taskboard list --status=todo
    taskboard start 1
    taskboard done 1
`);
}

// --- Dispatch ---

const commands = {
  list:   listTasks,
  get:    getTask,
  add:    addTask,
  update: updateTask,
  start:  startTask,
  done:   doneTask,
  delete: deleteTask,
  help:   showHelp,
};

const handler = commands[command];
if (!handler) {
  console.error(`\n  Unknown command: "${command}". Run "taskboard help" for usage.\n`);
  process.exit(1);
}

handler();
