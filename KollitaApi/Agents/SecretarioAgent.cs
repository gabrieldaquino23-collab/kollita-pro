using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using KollitaApi.Agents.Plugins;

namespace KollitaApi.Agents;

/// <summary>
/// Agente de Nivel Operativo para ayudar en las sucursales.
/// </summary>
public class SecretarioAgent
{
    private readonly Kernel _kernel;
    private readonly IChatCompletionService _chatService;
    private readonly ChatHistory _chatHistory;

    public SecretarioAgent(string apiKey)
    {
        // 1. Inicializamos el cerebro del agente
        var builder = Kernel.CreateBuilder()
            .AddOpenAIChatCompletion("gpt-3.5-turbo", apiKey);

        // 2. Le damos Herramientas (Plugins) para que pueda leer la BD
        builder.Plugins.AddFromType<InventoryPlugin>("Inventory");

        _kernel = builder.Build();
        _chatService = _kernel.GetRequiredService<IChatCompletionService>();
        
        // 3. Le damos su "Personalidad" (System Prompt)
        _chatHistory = new ChatHistory(
            "Eres el Secretario Virtual de Kollita Pro. " +
            "Tu trabajo es ayudar a los empleados de las sucursales a buscar precios, stock y guiar con el cierre de caja. " +
            "Eres amable, respondes corto y directo. Si te preguntan por stock, SIEMPRE usa tus herramientas para averiguarlo."
        );
    }

    public async Task<string> AskAsync(string userMessage)
    {
        _chatHistory.AddUserMessage(userMessage);

        // Permitimos que la IA decida automáticamente si necesita ejecutar una función C#
        OpenAIPromptExecutionSettings settings = new() 
        { 
            ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions 
        };

        var response = await _chatService.GetChatMessageContentAsync(_chatHistory, settings, _kernel);
        
        _chatHistory.AddAssistantMessage(response.Content ?? "");

        return response.Content ?? "Lo siento, tuve un problema interno.";
    }
}
