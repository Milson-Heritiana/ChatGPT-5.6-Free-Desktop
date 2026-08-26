// rev-d7e22b-20260825 App.h
#pragma once
#include <functional>
#include <string>
#include <vector>
#include "../personas/personas.h"

namespace gpt56 {

struct Message {
    std::string role;
    std::string content;
};

class Session {
public:
    void setSystemPrompt(const std::string& p);
    void addUser(const std::string& text);
    void forkAt(int index);
    const std::vector<Message>& messages() const { return msgs_; }
private:
    std::vector<Message> msgs_;
};

class App {
public:
    using TokenCb = std::function<void(const std::string&)>;
    bool init(const std::string& cfgPath);
    void setPersona(Persona p);
    void setContextWindow(size_t tokens);
    void send(const std::string& text, TokenCb cb);
    void branchFrom(int messageIndex);
    int run();

private:
    Persona persona_ = Persona::Sol;
    Session session_;
    int accent_ = 0;
};

} // namespace gpt56
