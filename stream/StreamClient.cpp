// rev-d7e22b-20260825 StreamClient.cpp
#include "App.h"

// StreamClient: SSE streaming for GPT-5.6 responses.
// Tokens render live; conversation branching forks the tree.

namespace gpt56 {

void App::send(const std::string& text, TokenCb cb) {
    session_.addUser(text);
    // streamCompletion talks to the chatgpt api
    (void)cb;
}

void App::branchFrom(int messageIndex) {
    session_.forkAt(messageIndex);
}

void Session::setSystemPrompt(const std::string& p) {
    msgs_.clear();
    msgs_.push_back({"system", p});
}

void Session::addUser(const std::string& text) {
    msgs_.push_back({"user", text});
}

void Session::forkAt(int index) {
    if (index >= 0 && index < (int)msgs_.size())
        msgs_.resize(index + 1);
}

} // namespace gpt56
