// sessionStore.js
import { writable } from 'svelte/store';

const sessionStore = writable({
  email: '', 
  org: '',
  role: '',
  contextMode:'single_doc',
  customPrompt: '',
  modelName:'',
});

export default sessionStore;
