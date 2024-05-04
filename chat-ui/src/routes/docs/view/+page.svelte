<script>
	import axios from "axios";

	async function loadDocument(documentType) {
		try {
			const response = await axios.get(`/docs/view?type=${documentType}`);
			const documentData = response.data.body.base64Content;

			const embed = document.getElementById("document-embed");
			embed.textContent = "";

			if (documentType === "image") {
				// Display image directly within a <div>
				const imageTag = document.createElement("img");
				imageTag.src = "data:image/jpeg;base64," + documentData;
				embed.appendChild(imageTag);
			} else if (documentType === "pdf") {
				// Display PDF directly within a <div>
				const blob = new Blob([Uint8Array.from(atob(documentData), (c) => c.charCodeAt(0))], {
					type: "application/pdf",
				});
				const blobUrl = URL.createObjectURL(blob);
				const embedElement = document.createElement("embed");
				embedElement.src = blobUrl
				embedElement.type = "application/pdf";
				embedElement.width = "100%";
				embedElement.height = "600px";
				embed.appendChild(embedElement);
			} else {
				// Display text or Word document within a <div>
				const contentDiv = document.createElement("div");
				contentDiv.style.width = "100%";
				contentDiv.style.height = "600px";

				if (documentType === "text") {
					// Display text file content
					contentDiv.textContent = atob(documentData);
				} else {
					// Display Word document content
					const blob = new Blob([Uint8Array.from(atob(documentData), (c) => c.charCodeAt(0))], {
						type: "application/msword",
					});
					const blobUrl = URL.createObjectURL(blob);

					const embedElement = document.createElement("embed");
					embedElement.src = blobUrl;
					embedElement.type = "application/msword";

					contentDiv.appendChild(embedElement);
				}

				embed.appendChild(contentDiv);
			}
		} catch (error) {
			console.error("Error loading document:", error);
		}
	}
</script>

<div>
	<h1>SecureGPT Document Viewer</h1>
	<div>
		<button on:click={() => loadDocument("text")}>Display Text</button> ||
		<button on:click={() => loadDocument("image")}>Display Image</button> ||
		<button on:click={() => loadDocument("pdf")}>Display PDF</button> ||
		<button on:click={() => loadDocument("word")}>Display Word Document</button> ||
		<!-- Add buttons for other document types as needed -->
	</div>
	<div id="document-embed" />
</div>
