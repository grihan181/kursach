package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/segmentio/kafka-go"
)

type quoteRequest struct {
	WeightKg    float64 `json:"weightKg"`
	LengthCm    float64 `json:"lengthCm"`
	WidthCm     float64 `json:"widthCm"`
	HeightCm    float64 `json:"heightCm"`
	Origin      string  `json:"origin"`
	Destination string  `json:"destination"`
	Currency    string  `json:"currency"`
}

type quoteResponse struct {
	ID         string  `json:"id"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"`
	ETADays    int     `json:"etaDays"`
	WeightKg   float64 `json:"weightKg"`
	Origin     string  `json:"origin"`
	Destination string `json:"destination"`
}

type quoteEvent struct {
	ID         string  `json:"id"`
	Amount     float64 `json:"amount"`
	Currency   string  `json:"currency"`
	Origin     string  `json:"origin"`
	Destination string `json:"destination"`
	WeightKg   float64 `json:"weightKg"`
	CreatedAt  string  `json:"createdAt"`
}

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func envFloat(key string, def float64) float64 {
	if v := os.Getenv(key); v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			return f
		}
	}
	return def
}

func main() {
	port := env("PORT", "8080")
	brokers := strings.Split(env("KAFKA_BROKERS", "kafka:9092"), ",")
	topic := env("QUOTE_TOPIC", "quote.events")
	basePrice := envFloat("BASE_PRICE", 15.0)
	weightRate := envFloat("WEIGHT_RATE", 2.5)
	volumeRate := envFloat("VOLUME_RATE", 0.01)
	defaultCurrency := env("CURRENCY", "USD")

	writer := &kafka.Writer{
		Addr:                   kafka.TCP(brokers...),
		Topic:                  topic,
		Balancer:               &kafka.LeastBytes{},
		AllowAutoTopicCreation: false,
	}
	defer writer.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]any{"status": "ok", "topic": topic})
	})

	mux.HandleFunc("/quotes", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var req quoteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "invalid payload", http.StatusBadRequest)
			return
		}
		if req.WeightKg <= 0 || req.Origin == "" || req.Destination == "" {
			http.Error(w, "weightKg, origin, destination are required", http.StatusBadRequest)
			return
		}

		volume := req.LengthCm * req.WidthCm * req.HeightCm
		amount := basePrice + req.WeightKg*weightRate + volume*volumeRate
		if amount < basePrice {
			amount = basePrice
		}
		eta := 5
		id := uuid.NewString()
		resp := quoteResponse{
			ID:          id,
			Amount:      amount,
			Currency:    chooseCurrency(req.Currency, defaultCurrency),
			ETADays:     eta,
			WeightKg:    req.WeightKg,
			Origin:      req.Origin,
			Destination: req.Destination,
		}

		event := quoteEvent{
			ID:          resp.ID,
			Amount:      resp.Amount,
			Currency:    resp.Currency,
			Origin:      resp.Origin,
			Destination: resp.Destination,
			WeightKg:    resp.WeightKg,
			CreatedAt:   time.Now().UTC().Format(time.RFC3339),
		}

		if err := produceEvent(r.Context(), writer, event); err != nil {
			log.Printf("failed to publish quote event: %v", err)
		}

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(resp)
	})

	server := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Printf("Pricing service listening on %s (topic=%s)", port, topic)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

func chooseCurrency(requested, fallback string) string {
	if requested != "" {
		return strings.ToUpper(requested)
	}
	return fallback
}

func produceEvent(ctx context.Context, writer *kafka.Writer, event quoteEvent) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("marshal: %w", err)
	}
	msg := kafka.Message{
		Key:   []byte(event.ID),
		Value: payload,
		Time:  time.Now(),
	}
	return writer.WriteMessages(ctx, msg)
}
