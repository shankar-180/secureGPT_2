<!-- src/routes/Modal.svelte -->
<script>
  export let show = false;

  function closeModal() {
    const element = document.getElementById("source-model");
    element.classList.remove("modal-show");
    element.classList.add("modal-hide");
  }
</script>

<!-- {#if show} -->
  <div id="source-model" class="modal-overlay modal-hide">
    <div class="modal-content" on:click={(e) => e.stopPropagation()}>
      <h1><span id="doc_source_branding" class="branding">SecureGPT</span></h1>
      <button class="close-btn" on:click={closeModal}>Close</button>
      <div id="document-embed"></div>
    </div>

    
  </div>
<!-- {/if} -->

<style>
  .modal-overlay {
    position: fixed;
    top: 20px;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: left;
    justify-content: center;
    align-items: center;
    z-index: 99999; /* Adjust the z-index to ensure the modal is on top */
  }
  .modal-hide {
    display: none;
  }
  .modal-show { 
    display: flexbox;
  }
  .modal-content {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    max-width: 60%;
    width:900px;
    height: 100%;
  }
  .close-btn{
    font-size: large;
    margin-left:90%;
    color: navy;
    align-self: flex-end;
    display: flex;
    justify-content: flex-end;
  }
  .branding {
    margin-left:2px;
    color:black;
    font-size: 1.1em;
  }
</style>
