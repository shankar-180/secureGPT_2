<script lang="ts">
	import sessionStore from "$lib//sessionStore.js";
	import { onMount } from "svelte";
	import { page } from "$app/stores";
	import axios from "axios";
	import { goto } from "$app/navigation";
	import { PUBLIC_ORIGIN, PUBLIC_APP_ASSETS } from "$env/static/public";
	import { base } from "$app/paths";
	import Error from "../+error.svelte";
  
	let uploadInputRef: HTMLInputElement | null = null;
	let buttonRef: HTMLDivElement | null = null;
	export let data; //this holds the output from the load() function.
  
	// Update the total count on mount
	let totalCount = 0;
	onMount(() => {
	  totalCount = data.transaction.length;
	});
  
	//Get the email so that we store it in session
	let email = $page.data.user.email;
  
	//read from session
	let org;
	let role;
	sessionStore.subscribe(($session) => {
	  email = $session.email;
	  org = $session.org;
	  role = $session.role;
	});
  
	let uploading = false;
	let success = false;
	let error = false;
	let errorMessage = "";
  
	// Function to handle file selection and upload
	async function handleFileInputChange() {
	  const input = uploadInputRef;
	  if (input) input.click(); // Open the file picker
	}
  
	async function handleUpload(event) {
	  const inputElement = event.target;
	  uploading = true;
	  success = false;
  
	  try {
		const files = inputElement.files;
		let email = $page.data.user.email;
		if (files && files.length > 0) {
		  const formData = new FormData();
		  formData.append("file", files[0]); // Assuming we want to upload a single file
		  formData.append("email", email); // User email
  
		  //This uploads the data from UI to server. Its the server that will call the external API not the UI.
		  const response = await axios.post("/docs/upload", formData, {
			headers: {
			  "Content-Type": "multipart/form-data",
			},
		  });
		  //save in mongodb only if the response is returned and is not null
		  if (response) {
			const uploadResponse = JSON.stringify(response.data);
  
			if (response.data.code && response.data.code == 413) {
			  error = true;
			  success = false;
			  errorMessage = "File size exceeded the max allowed size of 100MB.";
			  console.log(errorMessage);
			  throw new Error("413");
			}
			//We will now upload the returned data from upload API to save in MongoDB. Call the server side of code so that we do not reveal MongoDB credentials.
			formData.append("saved_data", uploadResponse);
			formData.delete("file");
  
			// Call the server side of the code and pass the returned data to save to MongoDB. Never save in MongoDB directly from the UI code for security reason.
			const saveResponse = await axios.post("/docs/upload/db", uploadResponse, {
			  headers: {
				"Content-Type": "application/json",
			  },
			});
			if (saveResponse) {
			  //console.log("The upload metadata is successfully saved to MongoDB");
			} else {
			  //console.error("Upload metadata was not saved.");
			}
		  }
		} else {
		  //console.error("No file selected for upload.");
		}
		uploading = false;
		success = true;
	  } catch (error) {
		uploading = false;
		success = false;
		error = true;
		//console.error("An error occurred during file upload:", error);
	  }
	  uploading = false;
	  if (!error) success = true;
	  // Redirect after 3 seconds
	  setTimeout(() => {
		location.reload(); // Replace '/success' with your desired route
	  }, 3000);
  
	  inputElement.value = "";
	  goto("/docs");
	}
  
	async function handleDelete(doc_name) {
	  try {
		console.log("doc_name in svelte: "+ doc_name);
		const formData = new FormData();
		  formData.append("doc_name", doc_name);
		const response = await axios.post("/docs/delete", formData, {
			headers: {
			  "Content-Type": "text/json",
			},
		  });
		  console.log(response);
		// const response = await axios.delete("https://6xz1owomvn04h0-80.proxy.runpod.net/delete_file", {
		//   headers: {
		// 	Authorization: "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoic2Fuc2FyaSIsImV4cCI6MTc5NjMxMDQ0NH0.FgFpk64W54Uoai0mEv8rZdQtOgaBC7j_pa2Bd7VLJjE",
		//   },
		//   data: {
		// 	doc_name: doc_name,
		//   },
		// });
  
		// Assuming the delete operation is successful, you can remove the document from the UI by updating the `data` variable.
		// For example, you can filter out the deleted document from the `data.transaction` array:
		data.transaction = data.transaction.filter((doc) => doc.doc_name !== doc_name);
	  } catch (error) {
		console.error("An error occurred during document deletion:", error);
	  }
	}
  
	function toggleFullText() {
	  // Check if the element is currently truncated
	  const isTruncated = this.classList.contains("truncate-text");
	  if (isTruncated) {
		// If it's truncated, show full text
		this.classList.remove("truncate-text");
		this.classList.add("full-text");
	  } else {
		// If it's not truncated, truncate the text
		this.classList.add("truncate-text");
	  }
	}
  </script>
  
  <div class="upload_button_div">
	<!-- "+ Upload" button -->
	<!-- {#if role === 'admin'} -->
	{#if !uploading}
	  <button class="btn-upload-document" on:click={handleFileInputChange} bind:this={buttonRef}>
		+ Upload Files
	  </button>
	  {#if success}
		<div class="success">Document successfully uploaded.</div>
	  {/if}
	  {#if error}
		<div class="error">Document upload failed. Reason: {errorMessage}</div>
	  {/if}
  
	  Supported formats: txt, pdf, docx, png, jpg, zip
	{:else}
	  <div class="spinner">
		<!-- Add your spinner component here -->
		<div class="spinner-content">
		  Upload in progress... <img
			src="{PUBLIC_ORIGIN || $page.url.origin}{base}/{PUBLIC_APP_ASSETS}/progress.gif"
			alt=""
		  />
		</div>
	  </div>
	{/if}
	<!-- {/if} -->
	<div class="table-container">
	  <p>Number of Files: {totalCount.toLocaleString()}</p>
	  <table>
		<thead>
		  <td>File</td>
		  <td>Summary</td>
		  <td>Date</td>
		  <td>Uploaded by</td>
		  <td>Status</td>
		  <td>Action</td>
		</thead>
		<tbody>
		  {#each data.transaction as { doc_name, summary, upload_date, email, state, docId }}
			<tr>
			  <td class="truncate-text">{doc_name}</td>
			  <td><div class="truncate-text" on:click={toggleFullText}>{summary}</div></td>
			  <td>{upload_date}</td>
			  <td class="truncate-text">{email}</td>
			  <td class="truncate-text">{state}</td>
			  <td>
				<button on:click={() => handleDelete(doc_name)}>Delete</button>
			  </td>
			</tr>
		  {/each}
		</tbody>
	  </table>
	</div>
  </div>
  
  <input
	type="file"
	id="file-upload-input"
	accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg, .zip"
	style="display: none;"
	bind:this={uploadInputRef}
	on:change={handleUpload}
  />
  
  <style>
	/* Styles for your button */
	.btn-upload-document {
	  cursor: pointer;
	  background-color: #3490dc;
	  color: #ffffff;
	  padding: 6px 10px;
	  border: none;
	  border-radius: 4px;
	  font-size: 18px;
	}
  
	.btn-upload-document:hover {
	  background-color: #2779bd;
	}
	.upload_button_div {
	  margin: 50px;
	}
	table {
	  margin-top: 10px;
	  border-collapse: collapse;
	  width: 100%;
	}
  
	thead {
	  text-align: left;
	  background-color: #78716c;
	  color: #fff;
	}
	td {
	  padding: 8px;
	  font-size: 11px;
	  border: 1px solid lightslategray;
	}
  
	/* tr:nth-child(even) {
	  background-color: #f2f2f2;
	}
	tr:nth-child(odd) {
	  background-color: #e6f7ff;
	} */
	.truncate-text {
	  white-space: nowrap; /* Prevent text from wrapping */
	  overflow: hidden; /* Hide overflowing text */
	  text-overflow: ellipsis; /* Display an ellipsis for truncated text */
	  max-width: 150px; /* Adjust max-width as needed to fit your table cell */
	}
	.full-text {
	  white-space: normal;
	  overflow: visible;
	  text-overflow: inherit;
	  max-width: none;
	}
	.table-container {
	  max-height: 500px; /* Adjust the maximum height as needed */
	  overflow-y: auto;
	}
	.success {
	  color: green;
	}
	.error {
	  color: red;
	}
  </style>