using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace KollitaApi.Agents;

/// <summary>
/// Agente de Alto Nivel (Analítico) para supervisión global.
/// </summary>
public class SupervisorAgent
{
    private readonly Kernel _kernel;
    private readonly IChatCompletionService _chatService;
    private readonly ChatHistory _chatHistory;

    public SupervisorAgent(string apiKey)
    {
        // El supervisor puede usar un modelo más potente
        var builder = Kernel.CreateBuilder()
            .AddOpenAIChatCompletion("gpt-4-turbo", apiKey); 

        // TODO: Agregar Plugins Financieros y de Reportes aquí
        // builder.Plugins.AddFromType<ReportsPlugin>("Reports");

        _kernel = builder.Build();
        _chatService = _kernel.GetRequiredService<IChatCompletionService>();
        
        // Personalidad del Supervisor
        _chatHistory = new ChatHistory(
            "Eres el Agente Supervisor IA de la red de sucursales Kollita Pro. " +
            "Tu deber es auditar ventas, detectar pérdidas, analizar márgenes de ganancia y reportar anomalías. " +
            "Eres altamente analítico, hablas con terminología de negocios y vas directo a las métricas."
        );
    }

    public async Task<string> AnalyzeAsync(string userMessage)
    {
        _chatHistory.AddUserMessage(userMessage);

        OpenAIPromptExecutionSettings settings = new() 
        { 
            ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions 
        };

        var response = await _chatService.GetChatMessageContentAsync(_chatHistory, settings, _kernel);
        
        _chatHistory.AddAssistantMessage(response.Content ?? "");

        return response.Content ?? "Sin respuesta.";
    }
}
