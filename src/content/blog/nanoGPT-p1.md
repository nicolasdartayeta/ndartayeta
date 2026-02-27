---
title: "Building nanoGPT Part 1: Tokenization and Data prep"
description: "Describing the first steps of building a transformer decoder model"
pubDate: "2026-02-27"
updatedDate: "2026-02-27"
---
After recently wrapping up a course in deep learning, I wanted to step out of the guided notebooks and solidify what I learned. The best way to do that? Build something from scratch. 

My current project is building a Transformer decoder model using PyTorch, PyTorch Lightning and some other tools along the way. However, before writing a single line of self-attention code, I ran into the first real-world hurdle of any machine learning project: getting the data ready. 

While the model architecture usually gets all the glory, the data pipeline does the heavy lifting. In this first post, I’m going to document my process for building a custom tokenizer, processing the data, and writing an efficient data loader.  

## 1. Building the Tokenizer

Language models don't understand text; they understand numbers. The process of converting raw text into sequences of integers is called tokenization. To do this, I used Hugging Face’s `tokenizers` library. The components provided by this library prevented me from reinventing the wheel while also getting to know the essence of a tokenizer.

Instead of relying on a pre-trained tokenizer, I wanted to build and train my own. I set up a pipeline with the following stages:
1. **Normalization:** I applied NFKC (Normalization Form Compatibility Composition) and lowercasing to standardize the text and remove weird formatting quirks.
2. **Pre-tokenization:** I used a Byte-Level approach. This ensures that the tokenizer can handle any character it encounters by falling back to raw bytes, completely avoiding the dreaded `<UNK>` (unknown) tokens.
3. **The Model:** I used Byte-Pair Encoding (BPE), the same algorithm used by models like GPT-2 and GPT-4, which iteratively merges the most frequently occurring byte pairs.
4. **Post-tokenization:** Finally, I used a post-tokenizer to include EOS tokens to the generated sequence.  

For my initial testbed, I used the Spanish Wikipedia dataset from Hugging Face (`wikimedia/wikipedia`). I plan to swap this out for other datasets later to compare how the model learns, but Wikipedia is great for an initial, reasonably clean corpus.  

When configuring the tokenizer, I had to decide on a vocabulary size. I knew GPT-2 used a vocab of around 50,000, so I opted for **30,000** as a reasonable starting point for my project. I trained the tokenizer on the entire Spanish Wikipedia dataset, and honestly, modern hardware is amazing—it only took about 7 minutes to churn through the whole thing on my M4 MacBook Pro.

## 2. Storing Tokens Efficiently (Shoutout to Andrej Karpathy)

Once the tokenizer was trained, I needed to figure out how to feed the data to my model during training. 

The naive approach is to keep the raw text and tokenize it on the fly, but that could slow training down if the CPU can't keep up with how fast the GPU demands data. The second approach is to tokenize everything and hold the resulting integers in RAM. For a small dataset, that's fine. For millions of Wikipedia articles, that's a quick recipe for an out-of-memory crash.

To solve this, I took a page out of Andrej Karpathy’s playbook from his incredible `nanoGPT` repository. Instead of fighting with RAM, I pre-tokenized the entire dataset once and saved it to disk as a massive, flat `.bin` file. 

To read this file during training, I used `numpy.memmap`. 

Memory mapping is a fantastic technique. It allows you to read and write to large files on disk as if they were arrays in memory, without actually loading the whole file into your RAM. The operating system handles caching the chunks you access under the hood. It’s the perfect balance of retrieval speed and memory efficiency.

## 3. Creating the PyTorch Dataset and LightningDataModule

With the data tokenized and safely resting on disk, the final step was bridging it to PyTorch. 

During training, a Transformer needs sequences of a specific length (the context window, or `block_size`). To generate training samples from my massive 1D array of tokens, I needed to slice out chunks. I did this using two variables:
*   `block_size`: The length of the token sequence the model will look at.
*   `stride`: How many tokens we shift forward to start the next sequence.

I created a custom PyTorch `Dataset`. Inside it, I mapped the `.bin` file and used some simple math to grab the right chunk based on the dataset index:

```python
import torch
import numpy as np
from torch.utils.data import Dataset

class MemmapDataset(Dataset):
    def __init__(self, file_path, block_size, stride):
        self.file_path = file_path
        self.block_size = block_size
        self.stride = stride
        
        # Memory-map the flat binary file
        # uint16 is perfect since our vocab size is 30,000 (max 65,535)
        self.m = np.memmap(self.file_path, dtype=np.uint16, mode="r")
        
        # Calculate how many sequences we can extract
        self.num_samples = (len(self.m) - self.block_size) // self.stride

    def __len__(self):
        return self.num_samples

    def __getitem__(self, idx):
        # Calculate where this specific chunk starts
        offset = idx * self.stride
        
        # Slice the memmap array and convert directly to a PyTorch tensor
        chunk = self.m[offset : offset + self.block_size]
        return torch.tensor(chunk, dtype=torch.long)
```

Finally, to keep my project clean and scalable, I wrapped this `Dataset` (and its corresponding PyTorch `DataLoader`) inside a PyTorch `LightningDataModule`. PyTorch Lightning is great because it cleanly separates the data logic from the training loop, meaning when I eventually feed this data to the model, my data pipeline won't need to be rewritten and Lighning will handle the boilerplate training code.

## What's next

Setting up the data pipeline wasn't the flashiest part of this project, but getting it right feels incredibly rewarding. Going from raw text to a trained custom tokenizer, saving the outputs efficiently to a binary file, and streaming them seamlessly into PyTorch via `memmap` has given me a much deeper appreciation for the engineering behind LLMs.

Now that the plumbing is fully functional, the real fun begins. In my next post, I’ll be diving into the model architecture itself and the training process. Stay tuned!